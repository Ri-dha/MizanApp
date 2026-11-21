import { beforeEach, describe, expect, it } from "vitest"

import { memoryStore } from "../store/memoryStore"
import { installStore, table } from "../store/store"
import {
  addWidget, DEFAULT_LAYOUT, liveHomeLayout, liveSyncedPreferences, moveWidget, normaliseLayout, pickedFrom, pickSynced, placeWidget,
  reconcileSynced, removeWidget, saveHomeLayout, saveSyncedPreferences, shownWidgets, syncedPreferencesOf, templatesFor, updateWidget, WIDGETS, widgetsFor,
} from "./homeLayout"
import type { HomeLayout, HomeWidget } from "../schema"

const kinds = (widgets: HomeWidget[]) => widgets.map((w) => w.kind)

describe("home layout", () => {
  it("starts with one card of every template, the extra ones switched off", () => {
    expect(kinds(DEFAULT_LAYOUT)).toEqual(WIDGETS.map((w) => w.kind))
    expect(DEFAULT_LAYOUT.map((w) => w.id)).toEqual(WIDGETS.map((w) => w.kind))
    expect(DEFAULT_LAYOUT.filter((w) => !w.visible).map((w) => w.kind)).toEqual(["goals", "debts"])
    expect(DEFAULT_LAYOUT.find((w) => w.kind === "bills")?.options).toEqual({ count: "5" })
  })

  it("gives cards saved before cards could repeat their kind as an id, and adds new templates hidden", () => {
    const saved = [
      { kind: "cash", visible: true, size: "compact", options: { currency: "USD" } },
      { kind: "netWorth", visible: false, size: "full", options: { breakdown: "classes" } },
    ] as unknown as HomeWidget[]
    const layout = normaliseLayout(saved)
    expect(layout.slice(0, 2)).toEqual([
      { id: "cash", kind: "cash", visible: true, size: "compact", options: { currency: "USD" } },
      { id: "netWorth", kind: "netWorth", visible: false, size: "full", options: { breakdown: "classes" } },
    ])
    expect(layout).toHaveLength(WIDGETS.length)
    expect(layout.slice(2).every((w) => !w.visible)).toBe(true)
  })

  it("drops what this app does not know and resets values it does not offer", () => {
    const saved = [
      { id: "w", kind: "weather", visible: true, size: "full", options: {} },
      { id: "b", kind: "bills", visible: true, size: "huge", options: { count: "99", colour: "red" }, title: "  ", pick: ["x"] },
      { id: "b", kind: "bills", visible: false, size: "full", options: { count: "3" } },
    ] as unknown as HomeWidget[]
    const [first] = normaliseLayout(saved)
    expect(first).toEqual({ id: "b", kind: "bills", visible: true, size: "full", options: { count: "5" } })
    expect(normaliseLayout(saved).filter((w) => w.kind === "bills")).toHaveLength(1)
  })

  it("keeps several cards of one template, each with its own name and picked accounts", () => {
    let layout = addWidget(DEFAULT_LAYOUT, "cash", "savings")
    layout = updateWidget(layout, "savings", { title: "Savings", pick: ["bank", "gold-box"] })
    const cash = normaliseLayout(layout).filter((w) => w.kind === "cash")
    expect(cash.map((w) => w.id)).toEqual(["cash", "savings"])
    expect(cash[1]).toMatchObject({ title: "Savings", pick: ["bank", "gold-box"], visible: true })
    expect(pickedFrom(cash[1], [{ id: "bank" }, { id: "wallet" }, { id: "gold-box" }])).toEqual([{ id: "bank" }, { id: "gold-box" }])
    expect(pickedFrom(cash[0], [{ id: "bank" }, { id: "wallet" }])).toHaveLength(2)
  })

  it("removes a repeated card, but keeps the last of a kind hidden for older apps", () => {
    const two = addWidget(DEFAULT_LAYOUT, "cash", "second")
    const one = removeWidget(two, "second")
    expect(one.filter((w) => w.kind === "cash")).toHaveLength(1)
    const none = removeWidget(one, "cash")
    expect(none.filter((w) => w.kind === "cash")).toEqual([expect.objectContaining({ id: "cash", visible: false })])
    expect(shownWidgets(none).some((w) => w.kind === "cash")).toBe(false)
  })

  it("moves a card past hidden ones and stops at either end", () => {
    const moved = moveWidget(DEFAULT_LAYOUT, "month", -1)
    expect(kinds(moved).slice(0, 2)).toEqual(["month", "netWorth"])
    expect(moveWidget(moved, "month", -1)).toBe(moved)
    const added = addWidget(DEFAULT_LAYOUT, "plan", "plan-2")
    expect(kinds(shownWidgets(moveWidget(added, "plan-2", -1))).slice(-2)).toEqual(["plan", "cash"])
  })

  it("changes one card without touching the rest", () => {
    const changed = updateWidget(DEFAULT_LAYOUT, "plan", { size: "compact", options: { figure: "spent" } })
    expect(changed.find((w) => w.id === "plan")).toEqual({ id: "plan", kind: "plan", visible: true, size: "compact", options: { figure: "spent" } })
    expect(changed.filter((w) => w.id !== "plan")).toEqual(DEFAULT_LAYOUT.filter((w) => w.id !== "plan"))
  })

  it("places a dragged card where it was dropped, the others keeping their order", () => {
    const start = kinds(DEFAULT_LAYOUT)
    expect(kinds(placeWidget(DEFAULT_LAYOUT, start[0], 3))).toEqual([start[1], start[2], start[3], start[0], ...start.slice(4)])
    expect(placeWidget(DEFAULT_LAYOUT, start[2], 2)).toBe(DEFAULT_LAYOUT)
    expect(placeWidget(DEFAULT_LAYOUT, start[2], 99)).toBe(DEFAULT_LAYOUT)
  })
})

describe("synced reading preferences", () => {
  beforeEach(() => {
    installStore(memoryStore())
  })

  it("creates the private row with just the changed preference", async () => {
    await saveSyncedPreferences({ showHijri: true })
    const [row] = await table("homeLayouts").all()
    expect(row.visibility).toBe("PRIVATE")
    expect(await liveSyncedPreferences()).toEqual({ showHijri: true })
    const [op] = await table("outbox").all()
    expect(Object.keys(op.fields).sort()).toEqual(["showHijri", "visibility"])
  })

  it("changes one preference without touching the cards or the others", async () => {
    await saveHomeLayout(DEFAULT_LAYOUT)
    await saveSyncedPreferences({ digitStyle: "eastern", valuationReminderMonths: 12 })
    await saveSyncedPreferences({ digitStyle: "western" })
    expect(await liveSyncedPreferences()).toEqual({ digitStyle: "western", valuationReminderMonths: 12 })
    expect(await liveHomeLayout()).toEqual(DEFAULT_LAYOUT)
    expect(await table("homeLayouts").count()).toBe(1)
  })

  it("keeps only the synced preferences and the values this app understands", async () => {
    expect(pickSynced({ digitStyle: "eastern", language: "ar", theme: "dark" })).toEqual({ digitStyle: "eastern" })
    const row = { digitStyle: "roman", showUsd: "yes", showHijri: false, valuationReminderMonths: 0 } as unknown as HomeLayout
    expect(syncedPreferencesOf(row)).toEqual({ showHijri: false })
  })
})

describe("simple and advanced modes (ADR mode-1)", () => {
  it("leaves planning and wealth cards out of simple mode without touching the layout", () => {
    expect(kinds(widgetsFor("simple", DEFAULT_LAYOUT))).toEqual(["netWorth", "month", "dollar", "cash", "debts"])
    expect(widgetsFor("advanced", DEFAULT_LAYOUT)).toEqual(DEFAULT_LAYOUT)
    expect(templatesFor("simple").map((w) => w.kind)).not.toContain("plan")
  })

  it("reads the mode from the row and ignores a value it does not know", () => {
    expect(syncedPreferencesOf({ appMode: "simple" } as unknown as HomeLayout)).toEqual({ appMode: "simple" })
    expect(syncedPreferencesOf({ appMode: "expert" } as unknown as HomeLayout)).toEqual({})
  })
})

describe("reconciling a device with the row", () => {
  const defaults = { digitStyle: "western", showUsd: false, showHijri: false, valuationReminderMonths: 6, appMode: "advanced" } as const
  const local = { ...defaults, digitStyle: "eastern", showHijri: true } as const

  it("takes the row's values over the device's", () => {
    expect(reconcileSynced({ digitStyle: "western", showUsd: true }, local, defaults, true)).toEqual({ apply: { digitStyle: "western", showUsd: true }, seed: {} })
  })

  it("seeds an empty row with this device's choices, but only after a sync", () => {
    expect(reconcileSynced({}, local, defaults, false)).toEqual({ apply: {}, seed: {} })
    expect(reconcileSynced({}, local, defaults, true)).toEqual({ apply: {}, seed: { digitStyle: "eastern", showHijri: true } })
  })

  it("carries a new account's choice of simple mode to the row, and leaves a device's mode alone when the row has none", () => {
    expect(reconcileSynced({}, { ...defaults, appMode: "simple" }, defaults, true)).toEqual({ apply: {}, seed: { appMode: "simple" } })
    expect(reconcileSynced({ digitStyle: "western" }, { ...defaults, appMode: "simple" }, defaults, true)).toEqual({ apply: {}, seed: {} })
  })
})
