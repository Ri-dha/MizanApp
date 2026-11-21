import { describe, expect, it } from "vitest"

import { usdToBaseMicros } from "../market/currency"
import { dollarRateMinor, dollarRateOf, inDollarCents } from "./netWorthView"

describe("the dollar line on net worth", () => {
  const dinar = { baseCurrency: "IQD", usdBaseMicros: 1_310_000_000, usdIqdMicros: 1_310_000_000 }
  const euro = { baseCurrency: "EUR", usdBaseMicros: usdToBaseMicros("EUR", { EUR: 0.92 }), usdIqdMicros: 1_310_000_000 }

  it("uses the household currency's rate, not the dinar's", () => {
    expect(dollarRateOf(euro)).toBeCloseTo(0.92)
    expect(inDollarCents(92_00, "EUR", euro)).toBe(100_00)
    expect(dollarRateMinor(euro, "EUR")).toBe(92)
  })

  it("keeps dinar households as before", () => {
    expect(inDollarCents(1_310_000, "IQD", dinar)).toBe(1000_00)
    expect(dollarRateMinor(dinar, "IQD")).toBe(1310)
  })

  it("reads old dinar snapshots and has nothing to say for dollar households", () => {
    expect(dollarRateOf({ usdIqdMicros: 1_300_000_000 })).toBe(1300)
    expect(dollarRateOf({ baseCurrency: "EUR", usdIqdMicros: 1_300_000_000 })).toBe(0)
    expect(inDollarCents(500, "USD", { baseCurrency: "USD", usdBaseMicros: 100_000_000 })).toBeNull()
  })
})
