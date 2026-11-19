import { describe, expect, it } from "vitest"

import { DEFAULT_LAYOUT, moveWidget, normaliseLayout, updateWidget, WIDGETS } from "./homeLayout"
import type { HomeWidget } from "../schema"

describe("home layout", () => {
  it("starts with every card, the extra ones switched off", () => {
    expect(DEFAULT_LAYOUT.map((w) => w.kind)).toEqual(WIDGETS.map((w) => w.kind))
    expect(DEFAULT_LAYOUT.filter((w) => !w.visible).map((w) => w.kind)).toEqual(["goals", "debts"])
    expect(DEFAULT_LAYOUT.find((w) => w.kind === "bills")?.options).toEqual({ count: "5" })
  })

  it("keeps the saved order and choices, and adds new cards hidden at the end", () => {
    const saved: HomeWidget[] = [
      { kind: "cash", visible: true, size: "compact", options: { currency: "USD" } },
      { kind: "netWorth", visible: false, size: "full", options: { breakdown: "classes" } },
    ]
    const layout = normaliseLayout(saved)
    expect(layout.slice(0, 2)).toEqual(saved)
    expect(layout).toHaveLength(WIDGETS.length)
    expect(layout.slice(2).every((w) => !w.visible)).toBe(true)
  })

  it("drops what this app does not know and resets values it does not offer", () => {
    const saved = [
      { kind: "weather", visible: true, size: "full", options: {} },
      { kind: "bills", visible: true, size: "huge", options: { count: "99", colour: "red" } },
      { kind: "bills", visible: false, size: "full", options: { count: "3" } },
    ] as unknown as HomeWidget[]
    const [first] = normaliseLayout(saved)
    expect(first).toEqual({ kind: "bills", visible: true, size: "full", options: { count: "5" } })
    expect(normaliseLayout(saved).filter((w) => w.kind === "bills")).toHaveLength(1)
  })

  it("moves a card one place and stops at either end", () => {
    const moved = moveWidget(DEFAULT_LAYOUT, "dollar", -1)
    expect(moved.slice(0, 2).map((w) => w.kind)).toEqual(["dollar", "netWorth"])
    expect(moveWidget(moved, "dollar", -1)).toBe(moved)
  })

  it("changes one card's size and options without touching the rest", () => {
    const changed = updateWidget(DEFAULT_LAYOUT, "plan", { size: "compact", options: { figure: "spent" } })
    expect(changed.find((w) => w.kind === "plan")).toEqual({ kind: "plan", visible: true, size: "compact", options: { figure: "spent" } })
    expect(changed.filter((w) => w.kind !== "plan")).toEqual(DEFAULT_LAYOUT.filter((w) => w.kind !== "plan"))
  })
})
