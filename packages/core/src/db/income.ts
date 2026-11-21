import { ALL_TABLES, rows, rowsBy, sorted, store, table } from "../store/store"
import { minorUnitsPerMajor } from "../domain/money/format"
import { type AccountShare, type IncomeReceipt, type IncomeSource, type IncomeSourceAmount, type Visibility } from "../schema"
import { softDelete, writeFields } from "./write"
import { monthWindow } from "../domain/calendar/month"
import { amountOn, plannedIncome, type Occurrence } from "../domain/income/planned"

export const RATE_SCALE = 1_000_000

export interface IncomeSourceInput {
  name: string
  amount: number
  currency: string
  fxRateMicros: number
  frequency: IncomeSource["frequency"]
  payDay: number | null
  anchorDate: string | null
  activeFrom: string
  activeTo: string | null
  note: string | null
  visibility: Visibility
  /** T-cash-movements: the usual split into cash accounts. */
  intoAccounts?: AccountShare[]
}

export interface ReceiptInput {
  incomeSourceId: string | null
  monthKey: string
  receivedOn: string
  amount: number
  currency: string
  fxRateMicros: number
  note: string | null
  visibility: Visibility
  /** T-cash-movements: where this payment went, by amount or percentage. */
  intoAccounts?: AccountShare[]
}

/** Base minor units for an amount in another currency's minor units; the rate is per minor unit (see rateToMicros). */
export function toBaseAmount(amount: number, fxRateMicros: number): number {
  return Math.round((amount * fxRateMicros) / RATE_SCALE)
}

/**
 * People type how many base units one unit of the currency is worth (1470 dinars for a dollar),
 * but amounts are stored in minor units, so the stored rate is base minor units per minor unit
 * of the currency (ADR rates-1): 1470 → 14,700,000 micros for dollars into dinars. This is the
 * only place that conversion lives.
 */
export function rateToMicros(rate: string | number, currency: string, base: string): number {
  return Math.round((Number(rate) * RATE_SCALE * minorUnitsPerMajor(base)) / minorUnitsPerMajor(currency))
}

export function microsToRate(fxRateMicros: number, currency: string, base: string): string {
  const rate = (fxRateMicros * minorUnitsPerMajor(currency)) / (RATE_SCALE * minorUnitsPerMajor(base))
  return String(Number(rate.toPrecision(8)))
}

export async function createIncomeSource(input: IncomeSourceInput): Promise<string> {
  const id = crypto.randomUUID()
  const sortOrder = await table("incomeSources").count()
  await store().transaction(ALL_TABLES, async () => {
    await writeFields<IncomeSource>("income_source", id, { ...input, sortOrder })
    await writeFields<IncomeSourceAmount>("income_source_amount", crypto.randomUUID(), {
      visibility: input.visibility, incomeSourceId: id, effectiveFrom: input.activeFrom,
      amount: input.amount, currency: input.currency, fxRateMicros: input.fxRateMicros, note: null,
    })
  })
  return id
}

export function liveAmountHistory() {
  return sorted(rows("incomeSourceAmounts", (a) => a.deletedAt === null), "effectiveFrom")
}

export function historyOf(source: IncomeSource, history: IncomeSourceAmount[]): IncomeSourceAmount[] {
  return history.filter((a) => a.incomeSourceId === source.id)
}

/**
 * A raise or a cut: appended to the history, and the source's own amount becomes the latest
 * known one. A source that predates the history gets its original amount recorded first, so
 * the months before the change keep planning on it.
 */
export async function recordAmountChange(source: IncomeSource, amount: number, effectiveFrom: string, note: string | null) {
  await store().transaction(ALL_TABLES, async () => {
    const existing = await rowsBy("incomeSourceAmounts", "incomeSourceId", source.id, (a) => a.deletedAt === null).then((found) => found.length)
    if (existing === 0) {
      await writeFields<IncomeSourceAmount>("income_source_amount", crypto.randomUUID(), {
        visibility: source.visibility, incomeSourceId: source.id, effectiveFrom: source.activeFrom, amount: source.amount,
        currency: source.currency, fxRateMicros: source.fxRateMicros, note: null,
      })
    }
    await writeFields<IncomeSourceAmount>("income_source_amount", crypto.randomUUID(), {
      visibility: source.visibility, incomeSourceId: source.id, effectiveFrom, amount,
      currency: source.currency, fxRateMicros: source.fxRateMicros, note,
    })
    await writeFields<IncomeSource>("income_source", source.id, { amount })
  })
}

export async function removeAmountChange(entry: IncomeSourceAmount, source: IncomeSource, history: IncomeSourceAmount[]) {
  await store().transaction(ALL_TABLES, async () => {
    await softDelete("income_source_amount", entry.id)
    const remaining = historyOf(source, history).filter((a) => a.id !== entry.id).sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1))
    const latest = remaining[remaining.length - 1]
    if (latest) await writeFields<IncomeSource>("income_source", source.id, { amount: latest.amount })
  })
}

export function currentAmount(source: IncomeSource, history: IncomeSourceAmount[], today: string): number {
  return amountOn({ baseAmount: source.amount, amountSteps: historyOf(source, history).map((a) => ({ effectiveFrom: a.effectiveFrom, baseAmount: a.amount })) }, today)
}

export async function updateIncomeSource(id: string, input: Partial<IncomeSourceInput>) {
  await writeFields<IncomeSource>("income_source", id, input)
}

export async function recordReceipt(input: ReceiptInput): Promise<string> {
  const id = crypto.randomUUID()
  await writeFields<IncomeReceipt>("income_receipt", id, { ...input, baseAmount: toBaseAmount(input.amount, input.fxRateMicros) })
  return id
}

export function liveIncomeSources() {
  return sorted(rows("incomeSources", (source) => source.deletedAt === null), "sortOrder")
}

export function liveReceiptsFor(monthKey: string) {
  return rowsBy("incomeReceipts", "monthKey", monthKey, (r) => r.deletedAt === null)
}

export interface PlannedOccurrence extends Occurrence {
  source: IncomeSource
  receipt: IncomeReceipt | undefined
}

/** Pay dates of the month with the receipt that settled each, if any (FR-INC-03). */
export function occurrencesFor(sources: IncomeSource[], receipts: IncomeReceipt[], monthKey: string, startDay: number, history: IncomeSourceAmount[] = []): PlannedOccurrence[] {
  const window = monthWindow(monthKey, startDay)
  const planned = plannedIncome(
    sources.map((s) => ({
      baseAmount: toBaseAmount(s.amount, s.fxRateMicros),
      frequency: s.frequency,
      payDay: s.payDay,
      anchorDate: s.anchorDate,
      activeFrom: s.activeFrom,
      activeTo: s.activeTo,
      amountSteps: historyOf(s, history).map((a) => ({ effectiveFrom: a.effectiveFrom, baseAmount: toBaseAmount(a.amount, a.fxRateMicros) })),
    })),
    window,
  )
  const unclaimed = [...receipts]
  return planned.occurrences.map((occurrence) => {
    const source = sources[occurrence.sourceIndex]
    const index = unclaimed.findIndex((r) => r.incomeSourceId === source.id)
    const receipt = index >= 0 ? unclaimed.splice(index, 1)[0] : undefined
    return { ...occurrence, source, receipt }
  })
}

export function monthIncome(occurrences: PlannedOccurrence[], receipts: IncomeReceipt[]) {
  return {
    planned: occurrences.reduce((sum, o) => sum + o.amount, 0),
    received: receipts.reduce((sum, r) => sum + r.baseAmount, 0),
  }
}
