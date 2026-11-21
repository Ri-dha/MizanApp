import { describe, expect, it } from "vitest"

import { isAppMode, shows } from "./appMode"

describe("app mode", () => {
  it("shows everything in advanced and only untagged parts in simple", () => {
    expect(shows("advanced", "plan")).toBe(true)
    expect(shows("advanced", undefined)).toBe(true)
    expect(shows("simple", "plan")).toBe(false)
    expect(shows("simple", "household")).toBe(false)
    expect(shows("simple", undefined)).toBe(true)
  })

  it("accepts only the two modes", () => {
    expect(isAppMode("simple")).toBe(true)
    expect(isAppMode("advanced")).toBe(true)
    expect(isAppMode("expert")).toBe(false)
    expect(isAppMode(undefined)).toBe(false)
  })
})
