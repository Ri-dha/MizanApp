import { describe, expect, it } from "vitest"

import { convertRow, minorFactor, type Rebase } from "./rebase"

const TO_DOLLARS: Rebase = { from: "IQD", to: "USD", factor: 1 / 1500, userId: "me", shared: true }
const row = (fields: Record<string, unknown>) => ({ id: "r", ownerId: "me", clocks: {}, deletedAt: null, visibility: "SHARED", ...fields })

describe("re-expressing base figures in a new currency (ADR currency-1)", () => {
  it("scales whole dinars into cents", () => {
    expect(minorFactor(TO_DOLLARS)).toBeCloseTo(100 / 1500)
  })

  it("turns a dinar expense into a dollar one at the change-day rate", () => {
    const changes = convertRow("ledger_transaction", row({ amount: 150_000, currency: "IQD", fxRateMicros: 1_000_000, baseAmount: 150_000 }), TO_DOLLARS)
    expect(changes).toEqual({ fxRateMicros: 66_667, baseAmount: 10_000 })
  })

  it("gives a record already in the new currency a rate of exactly one", () => {
    const changes = convertRow("ledger_transaction", row({ amount: 2_500, currency: "USD", fxRateMicros: 15_000_000, baseAmount: 37_500 }), TO_DOLLARS)
    expect(changes).toEqual({ fxRateMicros: 1_000_000, baseAmount: 2_500 })
  })

  it("keeps a third currency's rate in step with the base", () => {
    // 1 euro cent was 16.5 dinars; it becomes 1.1 US cents.
    expect(convertRow("asset", row({ currency: "EUR", fxRateMicros: 16_500_000 }), TO_DOLLARS)).toEqual({ fxRateMicros: 1_100_000 })
  })

  it("scales figures held only in the base, snapshots included", () => {
    expect(convertRow("bucket", row({ fixedAmount: 300_000 }), TO_DOLLARS)).toEqual({ fixedAmount: 20_000 })
    expect(convertRow("bucket", row({ fixedAmount: null }), TO_DOLLARS)).toEqual({ fixedAmount: null })
    const snapshot = convertRow("net_worth_snapshot", row({
      totalAssets: 15_000_000, totalLiabilities: 1_500_000, netWorth: 13_500_000, liquidAssets: null, illiquidAssets: 3_000_000,
      composition: [{ assetClass: "CASH", amount: 15_000_000, percent: 100 }],
    }), TO_DOLLARS)
    expect(snapshot).toMatchObject({ netWorth: 900_000, liquidAssets: null, illiquidAssets: 200_000, composition: [{ assetClass: "CASH", amount: 1_000_000, percent: 100 }] })
  })

  it("leaves own-currency figures and the dinar-per-dollar price alone", () => {
    expect(convertRow("cash_account", row({ balance: 150_000, currency: "IQD" }), TO_DOLLARS)).toBeNull()
    expect(convertRow("debt_payment", row({ amount: 10_000 }), TO_DOLLARS)).toBeNull()
    expect(convertRow("market_override", row({ instrument: "USDIQD", priceMicros: 1_500_000_000 }), TO_DOLLARS)).toBeNull()
    expect(convertRow("market_override", row({ instrument: "XAU", priceMicros: 150_000_000_000 }), TO_DOLLARS)).toEqual({ priceMicros: 10_000_000_000 })
  })
})
