import { describe, expect, it } from "vitest"

import { microsToRate, rateToMicros, toBaseAmount } from "./income"

describe("exchange rates per minor unit", () => {
  it("stores a typed dinars-per-dollar rate per cent and shows it back per dollar", () => {
    expect(rateToMicros("1470", "USD", "IQD")).toBe(14_700_000)
    expect(microsToRate(14_700_000, "USD", "IQD")).toBe("1470")
    expect(rateToMicros("1470.5", "USD", "IQD")).toBe(14_705_000)
    expect(rateToMicros("1", "IQD", "IQD")).toBe(1_000_000)
  })

  it("converts ten dollars ninety-nine at 1,470 to whole dinars", () => {
    expect(toBaseAmount(1099, rateToMicros("1470", "USD", "IQD"))).toBe(16_155)
  })

  it("works the other way round for a dollar household", () => {
    // 1 dinar = 0.00068 dollars: 0.068 cents per dinar.
    expect(rateToMicros("0.00068", "IQD", "USD")).toBe(68_000)
    expect(toBaseAmount(1_470_000, rateToMicros("0.00068", "IQD", "USD"))).toBe(99_960)
    expect(microsToRate(68_000, "IQD", "USD")).toBe("0.00068")
  })

  it("respects currencies with three decimals and none", () => {
    // 1 Kuwaiti dinar = 3.25 euros: 1000 fils make 325 cents.
    expect(toBaseAmount(1000, rateToMicros("3.25", "KWD", "EUR"))).toBe(325)
    // 1 euro = 160 yen: 100 cents make 160 yen.
    expect(toBaseAmount(100, rateToMicros("160", "EUR", "JPY"))).toBe(160)
  })
})

