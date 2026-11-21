import { ALL_TABLES, rows, rowsBy, sorted, store, table } from "../store/store"
import { type CashAccount, type CashAccountKind, type Visibility } from "../schema"
import { writeFields } from "./write"
import { recordCashAdjustment } from "./networth"
import { todayIso } from "../domain/calendar/month"

export interface CashAccountInput {
  name: string
  kind: CashAccountKind
  institution: string | null
  balance: number
  currency: string
  visibility: Visibility
}

export async function createCashAccount(input: CashAccountInput): Promise<string> {
  const id = crypto.randomUUID()
  const sortOrder = await table("cashAccounts").count()
  await writeFields<CashAccount>("cash_account", id, { ...input, sortOrder })
  return id
}

/**
 * {@code shownBalance}: the balance the person saw, linked income and spending included
 * (ADR cash-1); the adjustment log records the change from that, not from the last balance set.
 */
export async function updateCashAccount(id: string, input: Partial<CashAccountInput>, adjustmentNote: string | null = null, shownBalance?: number) {
  const existing = await table("cashAccounts").get(id)
  await store().transaction(ALL_TABLES, async () => {
    const before = existing ? { ...existing, balance: shownBalance ?? existing.balance } : undefined
    if (before && input.balance !== undefined && input.balance !== before.balance) {
      await recordCashAdjustment(before, input.balance, todayIso(), adjustmentNote)
    }
    await writeFields<CashAccount>("cash_account", id, input)
  })
}

export function liveAdjustmentsOf(accountId: string) {
  return sorted(rowsBy("cashAdjustments", "cashAccountId", accountId, (a) => a.deletedAt === null), "adjustedOn", "desc")
}

export function liveCashAccounts() {
  return sorted(rows("cashAccounts", (account) => account.deletedAt === null), "sortOrder")
}

export function totalsByCurrency(accounts: CashAccount[]): Record<string, number> {
  return accounts.reduce<Record<string, number>>((totals, account) => {
    totals[account.currency] = (totals[account.currency] ?? 0) + account.balance
    return totals
  }, {})
}
