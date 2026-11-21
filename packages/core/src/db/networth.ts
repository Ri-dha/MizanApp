import { rows, sorted } from "../store/store"
import { type Asset, type AssetValuation, type CashAccount, type CashAdjustment, type Debt, type DebtPayment, type MonthClose, type NetWorthSnapshot } from "../schema"
import { writeFields } from "./write"
import { baseBalanceOf } from "./debts"
import { toBaseAmount } from "./income"
import { assetTotals } from "./assets"
import { netWorth, type NetWorthResult } from "../domain/networth/networth"
import type { ResolvedPrices } from "../market/prices"
import { inBase } from "../market/currency"

/**
 * Cash in base currency at today's rates, the dinar at the household's dollar (ADR rates-2). An
 * account in a currency without a rate yet counts nothing rather than a wrong amount.
 */
export function cashInBase(accounts: CashAccount[], base: string, prices: ResolvedPrices): number {
  return accounts.reduce((sum, account) => sum + (inBase(account.balance, account.currency, base, prices.perUsd) ?? 0), 0)
}

export function debtBalances(debts: Debt[], payments: DebtPayment[]) {
  let receivables = 0
  let liabilities = 0
  for (const debt of debts) {
    if (debt.status !== "ACTIVE") continue
    const balance = Math.max(0, baseBalanceOf(debt, payments))
    if (debt.direction === "OWED") receivables += balance
    else liabilities += balance
  }
  return { receivables, liabilities }
}

export function liveNetWorth(
  accounts: CashAccount[], base: string, prices: ResolvedPrices, metalsValue: number, debts: Debt[], payments: DebtPayment[],
  assets: Asset[], valuations: AssetValuation[], today: string,
): NetWorthResult {
  const { receivables, liabilities } = debtBalances(debts, payments)
  return netWorth({ cash: cashInBase(accounts, base, prices), metals: metalsValue, receivables, ...assetTotals(assets, valuations, today, prices), liabilities })
}

export const liveSnapshots = () => sorted(rows("netWorthSnapshots", (s) => s.deletedAt === null), "takenAt")
export const liveMonthCloses = () => rows("monthCloses", (m) => m.deletedAt === null)

/** The snapshot a month closed on: the latest one taken for that month while it is closed. */
export function snapshotFor(monthKey: string, closes: MonthClose[], snapshots: NetWorthSnapshot[]): NetWorthSnapshot | undefined {
  const close = closes.find((c) => c.monthKey === monthKey)
  if (!close?.snapshotId) return undefined
  return snapshots.find((s) => s.id === close.snapshotId)
}

export function isMonthClosed(monthKey: string, closes: MonthClose[]): boolean {
  const close = closes.find((c) => c.monthKey === monthKey)
  return !!close && close.closedAt !== null && close.reopenedAt === null
}

/** One point per month for the trend chart: the closing snapshot of each closed month, oldest first. */
export function trendPoints(closes: MonthClose[], snapshots: NetWorthSnapshot[]) {
  return closes
    .filter((c) => c.snapshotId)
    .map((c) => snapshots.find((s) => s.id === c.snapshotId))
    .filter((s): s is NetWorthSnapshot => !!s)
    .sort((a, b) => (a.monthKey < b.monthKey ? -1 : 1))
}

export async function recordCashAdjustment(account: CashAccount, newBalance: number, adjustedOn: string, note: string | null) {
  await writeFields<CashAdjustment>("cash_adjustment", crypto.randomUUID(), {
    visibility: account.visibility, cashAccountId: account.id, adjustedOn, previousBalance: account.balance, newBalance, note,
  })
}

export { toBaseAmount }
