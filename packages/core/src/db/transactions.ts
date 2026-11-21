import { ALL_TABLES, rows, rowsBy, sorted, store, table } from "../store/store"
import { type CounterpartyType, type LedgerTransaction, type TransactionType, type Visibility } from "../schema"
import { restore, softDelete, writeFields } from "./write"
import { toBaseAmount } from "./income"

export interface TransactionInput {
  type: TransactionType
  occurredOn: string
  monthKey: string
  amount: number
  currency: string
  fxRateMicros: number
  bucketId: string | null
  category: string | null
  payee: string | null
  note: string | null
  counterpartyType: CounterpartyType | null
  counterpartyId: string | null
  attachmentId: string | null
  visibility: Visibility
  splitGroupId?: string | null
  assetId?: string | null
  /** T-cash-movements: the account paid from (an expense) or paid into (an income). */
  cashAccountId?: string | null
  /** T-cash-movements: what reached the other account of a transfer, in its currency. */
  counterAmount?: number | null
}

export async function createTransaction(input: TransactionInput): Promise<string> {
  const id = crypto.randomUUID()
  await writeFields<LedgerTransaction>("ledger_transaction", id, { splitGroupId: null, assetId: null, ...input, baseAmount: toBaseAmount(input.amount, input.fxRateMicros) })
  return id
}

/** FR-TRX-06: one purchase as several rows, one per bucket, sharing a group id; the parts must sum to the total. */
export async function createSplit(base: Omit<TransactionInput, "bucketId" | "amount">, parts: { bucketId: string; amount: number }[]): Promise<string> {
  if (parts.some((p) => p.amount <= 0)) throw new Error("SPLIT_PART_NOT_POSITIVE")
  const splitGroupId = crypto.randomUUID()
  await store().transaction(ALL_TABLES, async () => {
    for (const part of parts) await createTransaction({ ...base, bucketId: part.bucketId, amount: part.amount, splitGroupId })
  })
  return splitGroupId
}

export const liveSplitGroup = (splitGroupId: string) => rowsBy("transactions", "splitGroupId", splitGroupId, (t) => t.deletedAt === null)

/** FR-AST-07: expenses linked to an asset, all months, in base units. */
export async function runningCostsOf(assetId: string): Promise<number> {
  const expenses = await rowsBy("transactions", "assetId", assetId, (t) => t.deletedAt === null && t.type === "EXPENSE")
  return expenses.reduce((sum, t) => sum + t.baseAmount, 0)
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>) {
  const existing = await table("transactions").get(id)
  const amount = input.amount ?? existing?.amount ?? 0
  const rate = input.fxRateMicros ?? existing?.fxRateMicros ?? 1_000_000
  await writeFields<LedgerTransaction>("ledger_transaction", id, { ...input, baseAmount: toBaseAmount(amount, rate) })
}

export const deleteTransaction = (id: string) => softDelete("ledger_transaction", id)
export const restoreTransaction = (id: string) => restore("ledger_transaction", id)

export function liveTransactionsFor(monthKey: string) {
  return sorted(rowsBy("transactions", "monthKey", monthKey, (t) => t.deletedAt === null), "occurredOn", "desc")
}

const RECYCLE_BIN_DAYS = 30

export function liveRecentlyDeleted() {
  const cutoff = new Date(Date.now() - RECYCLE_BIN_DAYS * 86_400_000).toISOString()
  return sorted(rows("transactions", (t) => t.deletedAt !== null && t.deletedAt > cutoff), "deletedAt", "desc")
}

/** Mirrors the server's recycle-bin purge (BR-15) on this device's copy. */
export async function purgeExpiredDeletions() {
  const cutoff = new Date(Date.now() - RECYCLE_BIN_DAYS * 86_400_000).toISOString()
  const expired = await rows("transactions", (t) => t.deletedAt !== null && t.deletedAt <= cutoff)
  await table("transactions").bulkDelete(expired.map((t) => t.id))
}

export interface TransactionFilter {
  text: string
  bucketId: string | null
  type: TransactionType | null
  minAmount: number | null
  maxAmount: number | null
}

export const EMPTY_FILTER: TransactionFilter = { text: "", bucketId: null, type: null, minAmount: null, maxAmount: null }

export function filterTransactions(transactions: LedgerTransaction[], filter: TransactionFilter): LedgerTransaction[] {
  const text = filter.text.trim().toLowerCase()
  return transactions.filter((t) => {
    if (filter.bucketId && t.bucketId !== filter.bucketId) return false
    if (filter.type && t.type !== filter.type) return false
    if (filter.minAmount !== null && t.baseAmount < filter.minAmount) return false
    if (filter.maxAmount !== null && t.baseAmount > filter.maxAmount) return false
    if (text && ![t.payee, t.note, t.category].some((v) => v?.toLowerCase().includes(text))) return false
    return true
  })
}

export function spentByBucket(transactions: LedgerTransaction[]): Record<string, number> {
  const spent: Record<string, number> = {}
  for (const t of transactions) {
    if (t.type === "EXPENSE" && t.bucketId) spent[t.bucketId] = (spent[t.bucketId] ?? 0) + t.baseAmount
  }
  return spent
}

/** Transfers leave the source bucket and, when the destination is a bucket, arrive there (BR-04). */
export function transfersByBucket(transactions: LedgerTransaction[]) {
  const transfersOut: Record<string, number> = {}
  const transfersIn: Record<string, number> = {}
  for (const t of transactions) {
    if (t.type !== "TRANSFER") continue
    if (t.bucketId) transfersOut[t.bucketId] = (transfersOut[t.bucketId] ?? 0) + t.baseAmount
    if (t.counterpartyType === "BUCKET" && t.counterpartyId) {
      transfersIn[t.counterpartyId] = (transfersIn[t.counterpartyId] ?? 0) + t.baseAmount
    }
  }
  return { transfersIn, transfersOut }
}

export function knownCategories(transactions: LedgerTransaction[]): string[] {
  return [...new Set(transactions.map((t) => t.category).filter((c): c is string => !!c))].sort()
}
