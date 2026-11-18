import { beforeEach, describe, expect, it } from "vitest"

import { rows, rowsBy, sorted, store, table } from "@mizan/core/store/store"
import { db, type LedgerTransaction } from "@/db/schema"

const txn = (id: string, monthKey: string, occurredOn: string, payee: string | null): LedgerTransaction =>
  ({ id, monthKey, occurredOn, payee, ownerId: null, deletedAt: null, clocks: {}, bucketId: null, type: "EXPENSE" }) as unknown as LedgerTransaction

describe("dexieStore", () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it("is the store the web installs, and finds rows by indexed and plain fields", async () => {
    await table("transactions").bulkPut([txn("a", "2026-01", "2026-01-03", "Shop"), txn("b", "2026-02", "2026-02-01", null), txn("c", "2026-02", "2026-02-05", "Shop")])
    expect((await rowsBy("transactions", "monthKey", "2026-02")).map((t) => t.id).sort()).toEqual(["b", "c"])
    expect((await rowsBy("transactions", "payee", "Shop")).map((t) => t.id).sort()).toEqual(["a", "c"])
    expect((await rowsBy("transactions", "payee", null)).map((t) => t.id)).toEqual(["b"])
    expect((await sorted(rows("transactions"), "occurredOn", "desc")).map((t) => t.id)).toEqual(["c", "b", "a"])
    expect(await db.transactions.count()).toBe(3)
  })

  it("keys meta and the outbox by their own fields", async () => {
    await table("meta").put({ key: "k", value: 7 })
    expect(await table("meta").get("k")).toEqual({ key: "k", value: 7 })
    await table("meta").update("k", { value: 8 })
    expect((await db.meta.get("k"))?.value).toBe(8)
  })

  it("rolls a failed transaction back", async () => {
    await table("transactions").put(txn("a", "2026-01", "2026-01-03", null))
    await expect(store().transaction(["transactions"], async () => {
      await table("transactions").delete("a")
      throw new Error("boom")
    })).rejects.toThrow("boom")
    expect(await table("transactions").count()).toBe(1)
  })
})
