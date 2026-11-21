import { describe, expect, it } from "vitest"

import { monthFlow } from "./monthView"
import type { IncomeReceipt, LedgerTransaction } from "../schema"

const transaction = (type: LedgerTransaction["type"], baseAmount: number, bucketId: string | null = null) => ({ type, baseAmount, bucketId }) as LedgerTransaction
const receipt = (baseAmount: number) => ({ baseAmount }) as IncomeReceipt

describe("a month's money in and out (ADR mode-1)", () => {
  it("counts receipts and income transactions in, and every expense out whether or not it has a bucket", () => {
    const flow = monthFlow({
      receipts: [receipt(900_000)],
      transactions: [transaction("INCOME", 100_000), transaction("EXPENSE", 250_000), transaction("EXPENSE", 50_000, "food"), transaction("TRANSFER", 400_000)],
    })
    expect(flow).toEqual({ received: 1_000_000, spent: 300_000, left: 700_000 })
  })

  it("is zero for an empty month and negative when more went out than came in", () => {
    expect(monthFlow({ receipts: [], transactions: [] })).toEqual({ received: 0, spent: 0, left: 0 })
    expect(monthFlow({ receipts: [], transactions: [transaction("EXPENSE", 10)] }).left).toBe(-10)
  })
})
