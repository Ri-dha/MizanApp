import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { guessMapping, guessPositiveIs, mapRows, parseCsv, type CsvField, type CsvTable, type ImportedRow } from "@mizan/core/data/csvImport"
import { recallProfile, rememberProfile, writeImportedRows } from "@mizan/core/data/csvWrite"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import type { TransactionType } from "@mizan/core/schema"
import { rows as tableRows } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey } from "@/hooks/use-views"
import { toMinorUnits } from "@/utils/money"
import { takePendingCsv } from "./csv-pending"

const FIELDS: CsvField[] = ["ignore", "date", "amount", "type", "payee", "category", "note"]
const SIGNS: TransactionType[] = ["EXPENSE", "INCOME"]
const PREVIEW_ROWS = 8

/** FR-DAT-04: confirm which column is which, see the rows and duplicates, then write. */
export function useCsvImportScreen() {
  const { t } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const [table, setTable] = useState<CsvTable | null>(null)
  const [mapping, setMapping] = useState<CsvField[]>([])
  const [positiveIs, setPositiveIs] = useState<TransactionType>("EXPENSE")
  const [bucketId, setBucketId] = useState<string | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [profileName, setProfileName] = useState("")
  const [recalled, setRecalled] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const buckets = useLiveQuery(async () => liveBucketsOf(planFor(await livePlans(), currentMonthKey(startDay))?.id), [startDay], [])
  const existing = useLiveQuery(() => tableRows("transactions", (x) => x.deletedAt === null), [], [])

  useEffect(() => {
    const text = takePendingCsv()
    if (text === null) return
    const parsed = parseCsv(text)
    setTable(parsed)
    void recallProfile(parsed.headers).then((known) => {
      if (known) {
        setMapping(known.mapping)
        setPositiveIs(known.positiveIs)
        setBucketId(known.bucketId)
        setRecalled(known.name)
        return
      }
      const guessed = guessMapping(parsed.headers)
      setMapping(guessed)
      setPositiveIs(guessPositiveIs(parsed, guessed))
    })
  }, [])

  const rows: ImportedRow[] = table ? mapRows(table, mapping, existing, (v) => toMinorUnits(String(v), base), positiveIs) : []
  const ready = mapping.includes("date") && mapping.includes("amount")
  const importable = rows.filter((r) => r.error === null && !(skipDuplicates && r.duplicate))
  const duplicates = rows.filter((r) => r.duplicate).length
  const errors = rows.filter((r) => r.error).length

  async function commit() {
    if (!table) return
    setBusy(true)
    try {
      if (profileName.trim()) await rememberProfile(profileName.trim(), table.headers, mapping, positiveIs, bucketId)
      await writeImportedRows(importable, existing, base, startDay, bucketId)
      router.back()
    } finally {
      setBusy(false)
    }
  }

  return {
    loaded: table !== null,
    recalled,
    importCount: importable.length,
    canCommit: ready && importable.length > 0 && !busy,
    commit: () => void commit(),
    fieldOptions: FIELDS.map((f) => ({ value: f, label: t(`csv.fields.${f}`) })),
    columns: (table?.headers ?? []).map((header, i) => ({
      index: i,
      label: header || t("csv.column", { n: i + 1 }),
      value: mapping[i] ?? "ignore",
      set: (value: string | null) => { if (value) setMapping(mapping.map((m, j) => (j === i ? (value as CsvField) : m))) },
    })),
    signOptions: SIGNS.map((s) => ({ value: s, label: t(`transactions.types.${s}`) })),
    positiveIs,
    setPositiveIs: (value: string | null) => { if (value) setPositiveIs(value as TransactionType) },
    bucketOptions: buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour })),
    bucketId, setBucketId,
    total: rows.length, duplicates, errors,
    summary: t("csv.summary", { total: rows.length, ok: importable.length, duplicates, errors }),
    preview: rows.slice(0, PREVIEW_ROWS).map((r) => ({
      key: r.index,
      title: `${r.occurredOn || "?"} · ${t(`transactions.types.${r.type}`)}${r.payee ? ` · ${r.payee}` : ""}`,
      amount: String(r.amount),
      failed: !!r.error,
      duplicate: r.duplicate,
      status: r.error ? t(`csv.errors.${r.error}`) : r.duplicate ? t("csv.duplicate") : t("csv.ok"),
    })),
    skipDuplicates, setSkipDuplicates,
    profileName, setProfileName,
  }
}

export type CsvImportScreenModel = ReturnType<typeof useCsvImportScreen>
