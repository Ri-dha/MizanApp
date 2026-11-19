import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { guessMapping, guessPositiveIs, mapRows, parseCsv, type CsvField, type CsvTable, type ImportedRow } from "@mizan/core/data/csvImport"
import { recallProfile, rememberProfile, writeImportedRows } from "@mizan/core/data/csvWrite"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import type { TransactionType } from "@mizan/core/schema"
import { rows as tableRows } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey } from "@/hooks/use-views"
import { spacing, useBrandColors } from "@/theme"
import { toMinorUnits } from "@/utils/money"
import { takePendingCsv } from "./csv-pending"

const FIELDS: CsvField[] = ["ignore", "date", "amount", "type", "payee", "category", "note"]
const SIGNS: TransactionType[] = ["EXPENSE", "INCOME"]
const PREVIEW_ROWS = 8

/** FR-DAT-04: confirm which column is which, see the rows and duplicates, then write. */
export function CsvImport() {
  const { t } = useTranslation()
  const brand = useBrandColors()
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

  if (!table) return <Screen><Stack.Screen options={{ title: t("csv.title") }} /></Screen>
  return (
    <Screen>
      <Stack.Screen options={{ title: t("csv.title"), headerRight: () => <Button testID="csv-commit" variant="ghost" title={t("csv.import", { count: importable.length })} disabled={!ready || importable.length === 0 || busy} onPress={() => void commit()} /> }} />
      <ThemedText variant="subhead">{t("csv.body")}</ThemedText>
      {recalled ? <Notice>{t("csv.recalled", { name: recalled })}</Notice> : null}
      <Group>
        {table.headers.map((header, i) => (
          <Row key={i} last={i === table.headers.length - 1}>
            <View style={styles.field}>
              <ThemedText variant="caption">{header || t("csv.column", { n: i + 1 })}</ThemedText>
              <Chips testID={`csv-col-${i}`} options={FIELDS.map((f) => ({ value: f, label: t(`csv.fields.${f}`) }))} value={mapping[i] ?? "ignore"}
                onChange={(v) => v && setMapping(mapping.map((m, j) => (j === i ? (v as CsvField) : m)))} />
            </View>
          </Row>
        ))}
      </Group>
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("csv.positiveIs")}</ThemedText>
        <Chips options={SIGNS.map((s) => ({ value: s, label: t(`transactions.types.${s}`) }))} value={positiveIs} onChange={(v) => v && setPositiveIs(v as TransactionType)} />
      </View>
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("csv.bucket")}</ThemedText>
        <Chips options={buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour }))} value={bucketId} onChange={setBucketId} />
      </View>
      <ThemedText variant="subhead">{t("csv.summary", { total: rows.length, ok: importable.length, duplicates: rows.filter((r) => r.duplicate).length, errors: rows.filter((r) => r.error).length })}</ThemedText>
      <Group>
        {rows.slice(0, PREVIEW_ROWS).map((r, index, shown) => (
          <Row key={r.index} last={index === shown.length - 1} trailing={<ThemedText variant="subhead">{String(r.amount)}</ThemedText>}>
            <ThemedText style={r.error ? { color: brand.destructive } : null}>{`${r.occurredOn || "?"} · ${t(`transactions.types.${r.type}`)}${r.payee ? ` · ${r.payee}` : ""}`}</ThemedText>
            <ThemedText variant="caption">{r.error ? t(`csv.errors.${r.error}`) : r.duplicate ? t("csv.duplicate") : t("csv.ok")}</ThemedText>
          </Row>
        ))}
      </Group>
      <ToggleRow label={t("csv.skipDuplicates")} value={skipDuplicates} onChange={setSkipDuplicates} />
      {recalled ? null : (
        <>
          <TextField testID="csv-profile" label={t("csv.remember")} placeholder={t("csv.rememberPlaceholder")} maxLength={40} value={profileName} onChangeText={setProfileName} />
          <ThemedText variant="caption">{t("csv.rememberHint")}</ThemedText>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
})
