import { describe, expect, it } from "vitest"

import { isAppStyle, viewFor } from "./appStyle"

describe("app style", () => {
  it("accepts only the three templates", () => {
    expect(isAppStyle("mizan")).toBe(true)
    expect(isAppStyle("clear")).toBe(true)
    expect(isAppStyle("soft")).toBe(true)
    expect(isAppStyle("fluent")).toBe(false)
    expect(isAppStyle(undefined)).toBe(false)
  })

  it("falls back to the Soft view when a template has none of its own", () => {
    expect(viewFor({ soft: "s", clear: "c" }, "clear")).toBe("c")
    expect(viewFor({ soft: "s", clear: "c" }, "mizan")).toBe("s")
    expect(viewFor({ soft: "s" }, "soft")).toBe("s")
  })
})
