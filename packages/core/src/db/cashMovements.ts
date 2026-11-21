import { rows } from "../store/store"
import type { AccountShare, CashAccount, Debt, IncomeReceipt, LedgerTransaction } from "../schema"
import { inBase } from "../market/currency"
import { liveCashAccounts } from "./cashAccounts"
import { createTransaction, updateTransaction } from "./transactions"

const BASIS_POINTS = 10_000

/** One share of an income in minor units of the income's currency. */
export interface ResolvedShare {
  cashAccountId: string
  amount: number
}

/** Fixed shares as given, percentage shares of the whole income. */
export function resolveShares(amount: number, shares: AccountShare[] | undefined): ResolvedShare[] {
  return (shares ?? []).map((share) => ({
    cashAccountId: share.cashAccountId,
    amount: share.kind === "AMOUNT" ? share.value : Math.round((amount * share.value) / BASIS_POINTS),
  }))
}

/** What the shares leave out of the income; negative when they ask for more than came in. */
export function unassigned(amount: number, shares: AccountShare[] | undefined): number {
  return amount - resolveShares(amount, shares).reduce((sum, s) => sum + s.amount, 0)
}

/** A change to an account's balance from a record linked to it, in the account's currency. */
export interface Movement {
  recordId: string
  cashAccountId: string
  amount: number
  on: string
  kind: "INCOME" | "EXPENSE" | "TRANSFER" | "DEBT"
}

export interface MovementSources {
  receipts: IncomeReceipt[]
  transactions: LedgerTransaction[]
  /** Every debt, for its direction: a payment on one you owe leaves an account, on one owed to you arrives. */
  debts: Debt[]
}

/**
 * ADR cash-1: a balance is what the person last set plus the linked records saved since. Stored
 * balances are never rewritten, so two devices recording at once cannot lose either change; a
 * link counts when its field clock is later than the balance's, so setting a balance by hand
 * takes in everything recorded before it.
 */
export function movementsOf(accounts: CashAccount[], sources: MovementSources, perUsd: Record<string, number>): Movement[] {
  const byId = new Map(accounts.map((a) => [a.id, a]))
  const after = (account: CashAccount, linkClock: string | undefined) => (linkClock ?? "") > (account.clocks?.balance ?? "")
  const movements: Movement[] = []

  for (const receipt of sources.receipts) {
    if (receipt.deletedAt !== null) continue
    for (const share of resolveShares(receipt.amount, receipt.intoAccounts)) {
      const account = byId.get(share.cashAccountId)
      if (!account || !after(account, receipt.clocks?.intoAccounts)) continue
      const amount = inBase(share.amount, receipt.currency, account.currency, perUsd)
      if (amount !== null) movements.push({ recordId: receipt.id, cashAccountId: account.id, amount, on: receipt.receivedOn, kind: "INCOME" })
    }
  }

  for (const transaction of sources.transactions) {
    if (transaction.deletedAt !== null || !transaction.cashAccountId) continue
    if (isAccountTransfer(transaction)) {
      movements.push(...transferMovements(transaction, byId, after, perUsd))
      continue
    }
    if (transaction.type === "TRANSFER" && transaction.counterpartyType === "DEBT") {
      const debt = sources.debts.find((d) => d.id === transaction.counterpartyId)
      const account = byId.get(transaction.cashAccountId)
      if (!debt || !account || !after(account, transaction.clocks?.cashAccountId)) continue
      const amount = inBase(transaction.amount, transaction.currency, account.currency, perUsd)
      // Paying what you owe takes money out; someone paying you back puts it in.
      if (amount !== null) movements.push({ recordId: transaction.id, cashAccountId: account.id, amount: debt.direction === "OWING" ? -amount : amount, on: transaction.occurredOn, kind: "DEBT" })
      continue
    }
    if (transaction.type !== "EXPENSE" && transaction.type !== "INCOME") continue
    const account = byId.get(transaction.cashAccountId)
    if (!account || !after(account, transaction.clocks?.cashAccountId)) continue
    const amount = inBase(transaction.amount, transaction.currency, account.currency, perUsd)
    if (amount === null) continue
    const sign = transaction.type === "EXPENSE" ? -1 : 1
    movements.push({ recordId: transaction.id, cashAccountId: account.id, amount: sign * amount, on: transaction.occurredOn, kind: transaction.type })
  }
  for (const debt of sources.debts) {
    if (debt.deletedAt !== null || !debt.cashAccountId) continue
    const account = byId.get(debt.cashAccountId)
    if (!account || !after(account, debt.clocks?.cashAccountId)) continue
    const amount = inBase(debt.principal, debt.currency, account.currency, perUsd)
    // Borrowing brings money in; lending sends it out.
    if (amount !== null) movements.push({ recordId: debt.id, cashAccountId: account.id, amount: debt.direction === "OWING" ? amount : -amount, on: debt.startDate, kind: "DEBT" })
  }
  return movements
}

/** Money moved between two of the person's own accounts: no income, no spending, no plan bucket. */
export function isAccountTransfer(transaction: LedgerTransaction): boolean {
  return transaction.type === "TRANSFER" && !!transaction.cashAccountId && transaction.counterpartyType === "CASH_ACCOUNT" && !!transaction.counterpartyId
}

/** Out of one account in its currency; into the other as the amount that arrived, or today's rate when none was given. */
function transferMovements(
  transaction: LedgerTransaction, byId: Map<string, CashAccount>, after: (account: CashAccount, clock: string | undefined) => boolean,
  perUsd: Record<string, number>,
): Movement[] {
  const movements: Movement[] = []
  const from = byId.get(transaction.cashAccountId!)
  if (from && after(from, transaction.clocks?.cashAccountId)) {
    const out = inBase(transaction.amount, transaction.currency, from.currency, perUsd)
    if (out !== null) movements.push({ recordId: transaction.id, cashAccountId: from.id, amount: -out, on: transaction.occurredOn, kind: "TRANSFER" })
  }
  const to = byId.get(transaction.counterpartyId!)
  if (to && after(to, transaction.clocks?.counterpartyId)) {
    const arrived = transaction.counterAmount ?? inBase(transaction.amount, transaction.currency, to.currency, perUsd)
    if (arrived !== null) movements.push({ recordId: transaction.id, cashAccountId: to.id, amount: arrived, on: transaction.occurredOn, kind: "TRANSFER" })
  }
  return movements
}

/** The accounts with today's balances: what was set, moved by the linked records since. */
export function withMovements(accounts: CashAccount[], movements: Movement[]): CashAccount[] {
  const moved = new Map<string, number>()
  for (const m of movements) moved.set(m.cashAccountId, (moved.get(m.cashAccountId) ?? 0) + m.amount)
  return accounts.map((a) => (moved.has(a.id) ? { ...a, balance: a.balance + moved.get(a.id)! } : a))
}

export async function liveMovementSources(): Promise<MovementSources> {
  const [receipts, transactions, debts] = await Promise.all([
    rows("incomeReceipts", (r) => r.deletedAt === null && (r.intoAccounts?.length ?? 0) > 0),
    rows("transactions", (t) => t.deletedAt === null && !!t.cashAccountId),
    rows("debts", (d) => d.deletedAt === null),
  ])
  return { receipts, transactions, debts }
}

/** Every live account with today's balance; what net worth, Home and the Cash screen show. */
export async function liveAccountsNow(perUsd: Record<string, number>): Promise<CashAccount[]> {
  const [accounts, sources] = await Promise.all([liveCashAccounts(), liveMovementSources()])
  return withMovements(accounts, movementsOf(accounts, sources, perUsd))
}

export interface AccountTransfer {
  from: CashAccount
  to: CashAccount
  /** In the source account's currency. */
  amount: number
  /** In the destination's currency; what actually arrived when the two currencies differ. */
  counterAmount: number
  occurredOn: string
  monthKey: string
  /** Source currency to base, for the ledger's base figures. */
  fxRateMicros: number
  note: string | null
}

function transferFields(transfer: AccountTransfer) {
  return {
    type: "TRANSFER" as const, occurredOn: transfer.occurredOn, monthKey: transfer.monthKey,
    amount: transfer.amount, currency: transfer.from.currency, fxRateMicros: transfer.fxRateMicros,
    bucketId: null, category: null, payee: null, note: transfer.note,
    counterpartyType: "CASH_ACCOUNT" as const, counterpartyId: transfer.to.id, attachmentId: null,
    cashAccountId: transfer.from.id, counterAmount: transfer.from.currency === transfer.to.currency ? null : transfer.counterAmount,
    visibility: transfer.from.visibility === "PRIVATE" || transfer.to.visibility === "PRIVATE" ? ("PRIVATE" as const) : ("SHARED" as const),
  }
}

export async function createAccountTransfer(transfer: AccountTransfer): Promise<string> {
  return createTransaction(transferFields(transfer))
}

/**
 * Only the fields that changed are written: rewriting an unchanged account link would count it
 * again after a balance set by hand (ADR cash-1).
 */
export async function updateAccountTransfer(existing: LedgerTransaction, transfer: AccountTransfer) {
  const next = transferFields(transfer)
  const changed = Object.fromEntries(Object.entries(next).filter(([key, value]) => (existing as unknown as Record<string, unknown>)[key] !== value))
  if (Object.keys(changed).length > 0) await updateTransaction(existing.id, changed)
}
