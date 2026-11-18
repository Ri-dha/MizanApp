import { liveQuery } from "dexie"
import { beforeEach, describe, expect, it } from "vitest"

import { db } from "@/db/schema"
import { createTransaction, liveTransactionsFor } from "@mizan/core/db/transactions"
import { monthViewFor } from "@/features/plan/useMonthFigures"

const expense = { type: "EXPENSE", occurredOn: "2026-11-18", monthKey: "2026-11", amount: 7000, currency: "IQD", fxRateMicros: 1_000_000, bucketId: null, category: null, payee: "Shop", note: null, counterpartyType: null, counterpartyId: null, attachmentId: null, visibility: "SHARED" } as const

function emissions<T>(query: () => Promise<T>) {
  const seen: T[] = []
  const subscription = liveQuery(query).subscribe({ next: (value) => seen.push(value) })
  return { seen, stop: () => subscription.unsubscribe() }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 150))

describe("live queries see writes made through the store", () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it("a single read", async () => {
    const watch = emissions(() => liveTransactionsFor("2026-11"))
    await settle()
    await createTransaction({ ...expense })
    await settle()
    watch.stop()
    expect(watch.seen.at(-1)?.length).toBe(1)
  })

  it("a read made after several awaits (the month view)", async () => {
    const watch = emissions(() => monthViewFor("2026-11", 1))
    await settle()
    await createTransaction({ ...expense })
    await settle()
    watch.stop()
    expect(watch.seen.at(-1)?.transactions.length).toBe(1)
  })
})
