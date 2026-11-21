import { describe, expect, it } from "vitest"

import { inBase, marketFxRateMicros, perUsdTable, unitRate, usdToBaseMicros } from "./currency"

const PER_USD = perUsdTable([{ currency: "EUR", perUsd: 0.9 }, { currency: "KWD", perUsd: 0.3 }, { currency: "JPY", perUsd: 150 }], 1_500_000_000)

describe("rates for any household currency", () => {
  it("prices a dollar in the base's minor units", () => {
    expect(usdToBaseMicros("IQD", PER_USD)).toBe(1_500_000_000)
    expect(usdToBaseMicros("EUR", PER_USD)).toBe(90_000_000)
    expect(usdToBaseMicros("KWD", PER_USD)).toBe(300_000_000)
    expect(usdToBaseMicros("XYZ", PER_USD)).toBe(0)
  })

  it("stores today's rate per minor unit (ADR rates-1)", () => {
    expect(marketFxRateMicros("USD", "IQD", PER_USD)).toBe(15_000_000)
    expect(marketFxRateMicros("IQD", "EUR", PER_USD)).toBe(60_000)
    expect(marketFxRateMicros("EUR", "EUR", PER_USD)).toBe(1_000_000)
  })

  it("brings cash in any currency into the base, and nothing without a rate", () => {
    expect(inBase(1_500_000, "IQD", "EUR", PER_USD)).toBe(90_000)
    expect(inBase(1_000, "KWD", "JPY", PER_USD)).toBe(500)
    expect(inBase(100, "XYZ", "EUR", PER_USD)).toBeNull()
    expect(unitRate("EUR", "IQD", PER_USD)).toBeCloseTo(1666.67, 1)
  })
})
