import { beforeEach, describe, expect, it } from "vitest"

import { memoryStore } from "../store/memoryStore"
import { installStore, table } from "../store/store"

import { type CashAccount } from "../schema"
import { softDelete, writeFields } from "./write"

describe("writeFields", () => {
  beforeEach(async () => {
    installStore(memoryStore())
  })

  it("stamps every changed field and records one outbox op", async () => {
    await writeFields<CashAccount>("cash_account", "row-1", { name: "Wallet", balance: 1000, currency: "IQD", kind: "WALLET", visibility: "SHARED", institution: null, sortOrder: 0 })

    const row = await table("cashAccounts").get("row-1")
    expect(row?.name).toBe("Wallet")
    expect(Object.keys(row?.clocks ?? {})).toEqual(expect.arrayContaining(["name", "balance", "currency"]))

    const ops = await table("outbox").all()
    expect(ops).toHaveLength(1)
    expect(ops[0].rowId).toBe("row-1")
    expect(ops[0].fields).toMatchObject({ name: "Wallet", balance: 1000 })
    expect(Object.keys(ops[0].clocks)).toEqual(Object.keys(ops[0].fields))
  })

  it("stamps a later edit strictly after the first", async () => {
    await writeFields<CashAccount>("cash_account", "row-1", { name: "Wallet", balance: 1, currency: "IQD", kind: "WALLET", visibility: "SHARED", institution: null, sortOrder: 0 })
    const first = (await table("cashAccounts").get("row-1"))!.clocks.balance
    await writeFields<CashAccount>("cash_account", "row-1", { balance: 2 })
    const row = (await table("cashAccounts").get("row-1"))!

    expect(row.balance).toBe(2)
    expect(row.clocks.balance > first).toBe(true)
    expect(row.clocks.name).toBeDefined()
    expect(await table("outbox").count()).toBe(2)
  })

  it("soft-deletes as a stamped field so the deletion syncs like any edit", async () => {
    await writeFields<CashAccount>("cash_account", "row-1", { name: "Wallet", balance: 1, currency: "IQD", kind: "WALLET", visibility: "SHARED", institution: null, sortOrder: 0 })
    await softDelete("cash_account", "row-1")

    const row = (await table("cashAccounts").get("row-1"))!
    expect(row.deletedAt).not.toBeNull()
    expect(row.clocks.deletedAt).toBeDefined()
  })
})
