import { describe, expect, it } from "vitest"

import { addWidget, DEFAULT_LAYOUT, moveWidget, normaliseLayout, pickedFrom, placeWidget, removeWidget, shownWidgets, updateWidget, WIDGETS } from "./homeLayout"
import type { HomeWidget } from "../schema"

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
    const moved = moveWidget(DEFAULT_LAYOUT, "dollar", -1)
    expect(kinds(moved).slice(0, 2)).toEqual(["dollar", "netWorth"])
    expect(moveWidget(moved, "dollar", -1)).toBe(moved)
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
