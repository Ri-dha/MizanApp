import Dexie from "dexie"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createCashAccount } from "@mizan/core/db/cashAccounts"
import { onLocalWrite, writeFields } from "@mizan/core/db/write"
import type { CashAccount } from "@mizan/core/schema"
import { ALL_TABLES, store, table } from "@mizan/core/store/store"
import { db } from "@/db/schema"
import { applyImport, validateImport, EXPORT_FORMAT, EXPORT_VERSION } from "@/data/export"

const ACCOUNTS = 5
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

/**
 * Regression: the sync engine's write listener refreshes the pending count, which re-renders the
 * app. Run inside the writer's transaction, that work ended the transaction early in the browser
 * and a loop of writes failed at the third one (a five-row backup import, a currency change).
 * jsdom has no app to re-render, so the guarantee is checked directly: listeners run after the
 * transaction, never inside it.
 */
describe("several writes in one transaction while a listener reads the store", () => {
  let calls = 0
  let insideTransaction = 0
  let unsubscribe: () => void = () => {}

  beforeEach(async () => {
    await db.delete()
    await db.open()
    calls = 0
    insideTransaction = 0
    unsubscribe = onLocalWrite(() => {
      calls++
      if (Dexie.currentTransaction) insideTransaction++
      void table("outbox").count()
    })
  })

  afterEach(() => unsubscribe())

  it("keeps every write and still tells the listener once per write", async () => {
    await store().transaction(ALL_TABLES, async () => {
      for (let i = 0; i < ACCOUNTS; i++) {
        await writeFields<CashAccount>("cash_account", `account-${i}`, {
          visibility: "SHARED", name: `Account ${i}`, kind: "BANK", institution: null, balance: i, currency: "IQD", sortOrder: i,
        })
      }
    })
    await settle()

    expect(await db.cashAccounts.count()).toBe(ACCOUNTS)
    expect(await db.outbox.count()).toBe(ACCOUNTS)
    expect(calls).toBe(ACCOUNTS)
    expect(insideTransaction).toBe(0)
  })

  it("imports a backup with more than two rows", async () => {
    const rows = Array.from({ length: ACCOUNTS }, (_, i) => ({ id: `imported-${i}`, visibility: "SHARED", name: `Imported ${i}`, kind: "BANK", institution: null, balance: i, currency: "IQD", sortOrder: i }))
    const preview = validateImport({ format: EXPORT_FORMAT, version: EXPORT_VERSION, tables: { cash_account: rows } })

    expect(await applyImport(preview)).toBe(ACCOUNTS)
    expect(await db.cashAccounts.count()).toBe(ACCOUNTS)
  })

  it("leaves nothing behind when a write in the middle fails", async () => {
    await createCashAccount({ name: "Kept", kind: "WALLET", institution: null, balance: 1, currency: "IQD", visibility: "SHARED" })
    await expect(store().transaction(ALL_TABLES, async () => {
      await writeFields<CashAccount>("cash_account", "first", { visibility: "SHARED", name: "First", kind: "BANK", institution: null, balance: 1, currency: "IQD", sortOrder: 1 })
      throw new Error("stop")
    })).rejects.toThrow("stop")

    expect((await db.cashAccounts.toArray()).map((a) => a.name)).toEqual(["Kept"])
  })
})
