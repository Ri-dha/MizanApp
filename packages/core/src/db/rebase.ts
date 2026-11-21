import { api, unwrap } from "../api/client"
import { minorUnitsPerMajor } from "../domain/money/format"
import type { LocalSession } from "../session"
import { SYNC_TABLES, type SyncTableName, type Syncable } from "../schema"
import { ALL_TABLES, store, table } from "../store/store"
import { deleteMeta, readMeta, writeMeta } from "./meta"
import { toBaseAmount } from "./income"
import { writeFields } from "./write"

const MICROS = 1_000_000
const PENDING_KEY = "currency.pendingRebase"

/**
 * ADR currency-1: one conversion of base figures. {@code shared} converts the household's shared
 * records too (only the owner's device that made the change); otherwise only the member's own
 * private ones.
 */
export interface Rebase {
  from: string
  to: string
  /** Whole units of {@code to} per unit of {@code from}. */
  factor: number
  userId: string
  shared: boolean
}

type Row = Syncable & { visibility?: string } & Record<string, unknown>
type Changes = Record<string, unknown>

/** Records in their own currency carry a rate to the base; the base figure follows from it. */
const RATED: SyncTableName[] = [
  "income_source", "income_source_amount", "income_receipt", "recurring_expense", "ledger_transaction",
  "debt", "metal_lot", "metal_disposal", "asset",
]
const WITH_BASE_AMOUNT: ReadonlySet<SyncTableName> = new Set(["income_receipt", "ledger_transaction"])

/** Figures held only in the base currency, scaled by the factor. */
const SCALED: Partial<Record<SyncTableName, string[]>> = {
  bucket: ["fixedAmount"],
  expense_occurrence: ["expectedAmount", "actualAmount"],
  metal_disposal_lot: ["metalCost", "makingCharge", "fees"],
  bucket_move: ["amount"],
}

export function minorFactor(rebase: Pick<Rebase, "from" | "to" | "factor">): number {
  return rebase.factor * (minorUnitsPerMajor(rebase.to) / minorUnitsPerMajor(rebase.from))
}

function mine(row: Row, rebase: Rebase): boolean {
  if (row.visibility === "PRIVATE") return row.ownerId === rebase.userId || row.ownerId === null
  return rebase.shared
}

/** What one row becomes; null when nothing in it is a base figure. Exported for tests. */
export function convertRow(name: SyncTableName, row: Row, rebase: Rebase): Changes | null {
  const scale = minorFactor(rebase)
  const scaled = (value: unknown) => (typeof value === "number" ? Math.round(value * scale) : value)
  if (RATED.includes(name)) {
    const fxRateMicros = row.currency === rebase.to ? MICROS : Math.round(Number(row.fxRateMicros) * scale)
    const changes: Changes = { fxRateMicros }
    if (WITH_BASE_AMOUNT.has(name)) changes.baseAmount = toBaseAmount(Number(row.amount), fxRateMicros)
    return changes
  }
  const fields = SCALED[name]
  if (fields) return Object.fromEntries(fields.map((field) => [field, scaled(row[field])]))
  switch (name) {
    case "market_override":
      // A gold or silver price is per gram in the base; the dinar-per-dollar price is not a base figure.
      return row.instrument === "USDIQD" ? null : { priceMicros: scaled(row.priceMicros) }
    case "net_worth_snapshot":
      return {
        totalAssets: scaled(row.totalAssets), totalLiabilities: scaled(row.totalLiabilities), netWorth: scaled(row.netWorth),
        liquidAssets: scaled(row.liquidAssets), illiquidAssets: scaled(row.illiquidAssets),
        composition: (row.composition as { amount: number }[] | undefined)?.map((part) => ({ ...part, amount: scaled(part.amount) })) ?? [],
      }
    case "member_contribution": {
      const composition = row.composition as { shares: { amount: number }[]; illiquidAssets: number } | undefined
      return {
        totalAssets: scaled(row.totalAssets), totalLiabilities: scaled(row.totalLiabilities),
        composition: composition ? { shares: composition.shares.map((s) => ({ ...s, amount: scaled(s.amount) })), illiquidAssets: scaled(composition.illiquidAssets) } : composition,
      }
    }
    case "annual_report": {
      const report = row.report as { months: Record<string, unknown>[]; snapshots: { netWorth: number }[]; received: number; spent: number } | undefined
      if (!report) return null
      return {
        report: {
          ...report, baseCurrency: rebase.to, received: scaled(report.received), spent: scaled(report.spent),
          months: report.months.map((m) => ({ ...m, received: scaled(m.received), spent: scaled(m.spent), saved: scaled(m.saved) })),
          snapshots: report.snapshots.map((s) => ({ ...s, netWorth: scaled(s.netWorth) })),
        },
      }
    }
    default:
      return null
  }
}

/**
 * Converts every base figure this device may write, in one local transaction that also clears
 * the pending marker: a crash leaves either nothing converted and the marker set, or all of it.
 */
export async function convertRecords(rebase: Rebase): Promise<number> {
  await writeMeta(PENDING_KEY, rebase)
  let converted = 0
  await store().transaction(ALL_TABLES, async () => {
    for (const name of Object.keys(SYNC_TABLES) as SyncTableName[]) {
      const rows = (await table(SYNC_TABLES[name]).all()) as unknown as Row[]
      for (const row of rows) {
        if (!mine(row, rebase)) continue
        const changes = convertRow(name, row, rebase)
        if (!changes) continue
        await writeFields(name, row.id, changes)
        converted++
      }
    }
    await deleteMeta(PENDING_KEY)
  })
  return converted
}

/** A conversion a crash interrupted, finished on the next start. */
export async function finishPendingRebase(): Promise<boolean> {
  const pending = await readMeta<Rebase>(PENDING_KEY)
  if (!pending) return false
  await convertRecords(pending)
  return true
}

/** The owner changes the household currency; the caller has synced first so nothing old is still on its way. */
export async function changeBaseCurrency(session: LocalSession, to: string, factor: number): Promise<void> {
  await unwrap(api().PUT("/api/v1/households/current/base-currency", { body: { currency: to, factor } }))
  await convertRecords({ from: session.baseCurrency, to, factor, userId: session.userId, shared: true })
}

/** After another member's change: one of this member's devices wins the claim and converts their private records. */
export async function claimPendingRebase(session: LocalSession): Promise<boolean> {
  if ((session.baseGeneration ?? 0) <= (session.rebasedGeneration ?? 0)) return false
  const claim = await unwrap(api().POST("/api/v1/households/current/rebase-claims"))
  if (!claim.claimed) return false
  await convertRecords({ from: claim.fromCurrency, to: claim.baseCurrency, factor: Number(claim.factor), userId: session.userId, shared: false })
  return true
}
