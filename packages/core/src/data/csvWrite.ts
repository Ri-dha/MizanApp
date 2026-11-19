import { META_KEYS, readMeta, writeMeta } from "../db/meta"
import { RATE_SCALE } from "../db/income"
import { createTransaction } from "../db/transactions"
import { monthKeyFor } from "../domain/calendar/month"
import { suggestCategory } from "../domain/categorise"
import type { LedgerTransaction, TransactionType } from "../schema"
import { ALL_TABLES, store } from "../store/store"
import { headerSignature, type CsvField, type CsvProfile, type ImportedRow } from "./csvImport"

export async function recallProfile(headers: string[]): Promise<CsvProfile | undefined> {
  const profiles = (await readMeta<CsvProfile[]>(META_KEYS.csvProfiles)) ?? []
  return profiles.find((p) => p.signature === headerSignature(headers))
}

/** Phase 4: the mapping is remembered by the file's header row, so the next statement maps itself. */
export async function rememberProfile(name: string, headers: string[], mapping: CsvField[], positiveIs: TransactionType, bucketId: string | null) {
  const signature = headerSignature(headers)
  const others = ((await readMeta<CsvProfile[]>(META_KEYS.csvProfiles)) ?? []).filter((p) => p.signature !== signature)
  await writeMeta(META_KEYS.csvProfiles, [...others, { name, signature, mapping, positiveIs, bucketId }])
}

/** FR-DAT-04: expenses without a category or bucket take the suggestion learned from past rows. */
export async function writeImportedRows(rows: ImportedRow[], existing: LedgerTransaction[], currency: string, startDay: number, bucketId: string | null): Promise<number> {
  await store().transaction(ALL_TABLES, async () => {
    for (const row of rows) {
      const suggestion = row.type === "EXPENSE" && !row.category ? suggestCategory(row.payee ?? "", row.note ?? "", existing) : null
      await createTransaction({
        type: row.type, occurredOn: row.occurredOn, monthKey: monthKeyFor(row.occurredOn, startDay), amount: row.amount, currency, fxRateMicros: RATE_SCALE,
        bucketId: row.type === "INCOME" ? null : bucketId ?? suggestion?.bucketId ?? null, category: row.category ?? suggestion?.category ?? null,
        payee: row.payee, note: row.note, counterpartyType: null, counterpartyId: null, attachmentId: null, visibility: "SHARED",
      })
    }
  })
  return rows.length
}
