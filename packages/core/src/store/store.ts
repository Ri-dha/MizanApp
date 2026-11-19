import type {
  AnnualReport, Asset, AssetValuation, Attachment, Bucket, BucketMove, CashAccount, CashAdjustment, Debt, DebtPayment, ExpenseOccurrence, Goal,
  GoalDeposit, IncomeReceipt, IncomeSource, IncomeSourceAmount, LedgerTransaction, LocalBlob, LocalConflict, MarketOverride, MarketSetting,
  HomeLayout, MemberContribution, MetaEntry, MetalDisposal, MetalDisposalLot, MetalLot, MonthClose, NetWorthSnapshot, NotificationSetting, OutboxOp, Plan,
  PrivacySetting, RecurringExpense, SealedRecord,
} from "../schema"

/** Every table a device keeps, by its local name; the synced ones are the values of SYNC_TABLES. */
export interface Tables {
  cashAccounts: CashAccount
  incomeSources: IncomeSource
  incomeSourceAmounts: IncomeSourceAmount
  incomeReceipts: IncomeReceipt
  plans: Plan
  buckets: Bucket
  recurringExpenses: RecurringExpense
  expenseOccurrences: ExpenseOccurrence
  transactions: LedgerTransaction
  attachments: Attachment
  blobs: LocalBlob
  debts: Debt
  debtPayments: DebtPayment
  goals: Goal
  goalDeposits: GoalDeposit
  metalLots: MetalLot
  metalDisposals: MetalDisposal
  metalDisposalLots: MetalDisposalLot
  marketOverrides: MarketOverride
  marketSettings: MarketSetting
  cashAdjustments: CashAdjustment
  netWorthSnapshots: NetWorthSnapshot
  monthCloses: MonthClose
  assets: Asset
  assetValuations: AssetValuation
  bucketMoves: BucketMove
  privacySettings: PrivacySetting
  notificationSettings: NotificationSetting
  homeLayouts: HomeLayout
  memberContributions: MemberContribution
  annualReports: AnnualReport
  sealedInbox: SealedRecord
  outbox: OutboxOp
  conflicts: LocalConflict
  meta: MetaEntry
}

export type TableName = keyof Tables

/** The field each table is keyed by; every other table uses `id`. */
export const TABLE_KEYS: Partial<Record<TableName, string>> = { sealedInbox: "key", outbox: "opId", meta: "key" }

export function keyFieldOf(table: TableName): string {
  return TABLE_KEYS[table] ?? "id"
}

/** Per-household tables are small, so reads are whole tables or one indexed field, and sorting happens in code. */
export interface Table<T> {
  get(key: string): Promise<T | undefined>
  bulkGet(keys: string[]): Promise<(T | undefined)[]>
  all(): Promise<T[]>
  where<F extends keyof T & string>(field: F, value: T[F]): Promise<T[]>
  count(): Promise<number>
  put(row: T): Promise<void>
  bulkPut(rows: T[]): Promise<void>
  update(key: string, changes: Partial<T>): Promise<void>
  delete(key: string): Promise<void>
  bulkDelete(keys: string[]): Promise<void>
  clear(): Promise<void>
}

export const ALL_TABLES = "all"

/**
 * One device's local database. A transaction is atomic over the tables it names, may nest, and
 * must not await anything but this store inside it (IndexedDB commits a transaction that waits on
 * other work).
 */
export interface Store {
  table<K extends TableName>(name: K): Table<Tables[K]>
  transaction<R>(tables: TableName[] | typeof ALL_TABLES, work: () => Promise<R>): Promise<R>
}

let current: Store | null = null

/** Called once at start-up by each app with its own adapter (Dexie on the web, SQLite on phones). */
export function installStore(next: Store) {
  current = next
}

export function store(): Store {
  if (!current) throw new Error("STORE_NOT_SET")
  return current
}

export const table = <K extends TableName>(name: K): Table<Tables[K]> => store().table(name)

export type SortKey<T> = (row: T) => string | number | null | undefined

/** Stable sort by one key, nulls first like IndexedDB; ties keep the order they came in. */
export function sortBy<T>(rows: readonly T[], key: SortKey<T>, direction: "asc" | "desc" = "asc"): T[] {
  const sign = direction === "asc" ? 1 : -1
  return rows
    .map((row, index) => ({ row, index, value: key(row) }))
    .sort((a, b) => sign * compare(a.value, b.value) || a.index - b.index)
    .map((entry) => entry.row)
}

function compare(a: string | number | null | undefined, b: string | number | null | undefined): number {
  if (a === b) return 0
  if (a === null || a === undefined) return -1
  if (b === null || b === undefined) return 1
  return a < b ? -1 : 1
}

/*
 * These helpers chain with `then` on the adapter's own promises rather than being async functions:
 * Dexie's live queries only see reads made while its promises are awaited, so a native promise in
 * the chain makes later reads invisible and the screen stops updating.
 */
export function rows<K extends TableName>(name: K, keep?: (row: Tables[K]) => boolean): Promise<Tables[K][]> {
  return table(name).all().then((all) => (keep ? all.filter(keep) : all))
}

export function rowsBy<K extends TableName, F extends keyof Tables[K] & string>(
  name: K, field: F, value: Tables[K][F], keep?: (row: Tables[K]) => boolean,
): Promise<Tables[K][]> {
  return table(name).where(field, value).then((found) => (keep ? found.filter(keep) : found))
}

/** The old Dexie `sortBy(field)`, and `reverse().sortBy(field)` as "desc". */
export function sorted<T>(list: Promise<T[]>, field: keyof T, direction: "asc" | "desc" = "asc"): Promise<T[]> {
  return list.then((found) => sortBy(found, (row) => row[field] as string | number | null | undefined, direction))
}

const EVERY_TABLE: Record<TableName, true> = {
  cashAccounts: true, incomeSources: true, incomeSourceAmounts: true, incomeReceipts: true, plans: true, buckets: true, recurringExpenses: true,
  expenseOccurrences: true, transactions: true, attachments: true, blobs: true, debts: true, debtPayments: true, goals: true, goalDeposits: true,
  metalLots: true, metalDisposals: true, metalDisposalLots: true, marketOverrides: true, marketSettings: true, cashAdjustments: true,
  netWorthSnapshots: true, monthCloses: true, assets: true, assetValuations: true, bucketMoves: true, privacySettings: true,
  notificationSettings: true, homeLayouts: true, memberContributions: true, annualReports: true, sealedInbox: true, outbox: true, conflicts: true, meta: true,
}

/** Every local table; an adapter that creates tables up front (SQLite) uses this, so none is forgotten. */
export const TABLE_NAMES = Object.keys(EVERY_TABLE) as TableName[]
