import { beforeEach, describe, expect, it } from "vitest"

import { memoryStore } from "../store/memoryStore"
import { installStore, table } from "../store/store"
import { perUsdTable } from "../market/currency"
import { createCashAccount, updateCashAccount } from "./cashAccounts"
import { createAccountTransfer, liveAccountsNow, resolveShares, unassigned, updateAccountTransfer } from "./cashMovements"
import { recordReceipt } from "./income"
import { createTransaction } from "./transactions"
import { softDelete } from "./write"

const PER_USD = perUsdTable([], 1_500_000_000)
const balanceOf = async (id: string) => (await liveAccountsNow(PER_USD)).find((a) => a.id === id)!.balance

const account = (name: string, currency = "IQD", balance = 100_000) =>
  createCashAccount({ name, kind: "BANK", institution: null, balance, currency, visibility: "SHARED" })

const receipt = (amount: number, intoAccounts: Parameters<typeof recordReceipt>[0]["intoAccounts"], currency = "IQD") =>
  recordReceipt({ incomeSourceId: null, monthKey: "2026-11", receivedOn: "2026-11-21", amount, currency, fxRateMicros: currency === "IQD" ? 1_000_000 : 15_000_000, note: null, visibility: "SHARED", intoAccounts })

const expense = (amount: number, cashAccountId: string) =>
  createTransaction({ type: "EXPENSE", occurredOn: "2026-11-21", monthKey: "2026-11", amount, currency: "IQD", fxRateMicros: 1_000_000, bucketId: null, category: null, payee: null, note: null, counterpartyType: null, counterpartyId: null, attachmentId: null, visibility: "SHARED", cashAccountId })

describe("income and spending move cash balances (ADR cash-1)", () => {
  beforeEach(() => {
    installStore(memoryStore())
  })

  it("splits an income by fixed amounts and percentages", () => {
    const shares = [{ cashAccountId: "bank", kind: "AMOUNT" as const, value: 500_000 }, { cashAccountId: "wallet", kind: "PERCENT" as const, value: 3000 }]
    expect(resolveShares(1_000_000, shares)).toEqual([{ cashAccountId: "bank", amount: 500_000 }, { cashAccountId: "wallet", amount: 300_000 }])
    expect(unassigned(1_000_000, shares)).toBe(200_000)
    expect(unassigned(600_000, shares)).toBe(-80_000)
  })

  it("adds each share of a received income to its account, and takes spending off", async () => {
    const bank = await account("Bank")
    const wallet = await account("Wallet", "IQD", 0)
    await receipt(1_000_000, [{ cashAccountId: bank, kind: "PERCENT", value: 7000 }, { cashAccountId: wallet, kind: "AMOUNT", value: 300_000 }])
    await expense(50_000, wallet)

    expect(await balanceOf(bank)).toBe(800_000)
    expect(await balanceOf(wallet)).toBe(250_000)
  })

  it("converts a share into the account's currency", async () => {
    const dollars = await account("Dollars", "USD", 0)
    await receipt(1_500_000, [{ cashAccountId: dollars, kind: "PERCENT", value: 10_000 }])

    expect(await balanceOf(dollars)).toBe(100_000)
  })

  it("takes linked records in when the balance is set by hand, so nothing is counted twice", async () => {
    const bank = await account("Bank")
    await receipt(400_000, [{ cashAccountId: bank, kind: "PERCENT", value: 10_000 }])
    expect(await balanceOf(bank)).toBe(500_000)

    await updateCashAccount(bank, { balance: 480_000 }, null, 500_000)
    expect(await balanceOf(bank)).toBe(480_000)
    const [adjustment] = await table("cashAdjustments").all()
    expect(adjustment).toMatchObject({ previousBalance: 500_000, newBalance: 480_000 })

    await expense(30_000, bank)
    expect(await balanceOf(bank)).toBe(450_000)
  })

  it("stops counting a deleted record", async () => {
    const bank = await account("Bank")
    const id = await expense(20_000, bank)
    expect(await balanceOf(bank)).toBe(80_000)

    await softDelete("ledger_transaction", id)
    expect(await balanceOf(bank)).toBe(100_000)
  })

  it("moves money between two accounts without touching anything else", async () => {
    const bank = await account("Bank", "IQD", 1_000_000)
    const wallet = await account("Wallet", "IQD", 0)
    const [from, to] = [(await table("cashAccounts").get(bank))!, (await table("cashAccounts").get(wallet))!]
    await createAccountTransfer({ from, to, amount: 400_000, counterAmount: 400_000, occurredOn: "2026-11-21", monthKey: "2026-11", fxRateMicros: 1_000_000, note: null })

    expect(await balanceOf(bank)).toBe(600_000)
    expect(await balanceOf(wallet)).toBe(400_000)
  })

  it("exchanges at the rate actually received, and an edit counts once", async () => {
    const dollars = await account("Dollars", "USD", 50_000)
    const dinars = await account("Dinars", "IQD", 0)
    const [from, to] = [(await table("cashAccounts").get(dollars))!, (await table("cashAccounts").get(dinars))!]
    const id = await createAccountTransfer({ from, to, amount: 10_000, counterAmount: 147_000, occurredOn: "2026-11-21", monthKey: "2026-11", fxRateMicros: 15_000_000, note: null })
    expect(await balanceOf(dollars)).toBe(40_000)
    expect(await balanceOf(dinars)).toBe(147_000)

    await updateAccountTransfer((await table("transactions").get(id))!, { from, to, amount: 10_000, counterAmount: 146_500, occurredOn: "2026-11-21", monthKey: "2026-11", fxRateMicros: 15_000_000, note: "Exchange office" })
    expect(await balanceOf(dollars)).toBe(40_000)
    expect(await balanceOf(dinars)).toBe(146_500)
  })
})
