import { router } from "expo-router"
import { zipSync } from "fflate"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { applyImport, buildExport, ImportError, validateImport } from "@mizan/core/data/export"
import { EXPORT_COLUMNS, EXPORT_KINDS, exportTableFor, type ExportKind } from "@mizan/core/data/exportTables"
import { toCsv, toXlsx } from "@mizan/core/data/tabular"
import { mayWriteRecords } from "@mizan/core/roles"
import { useSession } from "@/hooks/use-core"
import { pickTextFile, shareFile } from "@/platform/files"
import { describeError } from "@/utils/errors"
import { setPendingCsv } from "./csv-pending"

const JSON_MIME = "application/json"
const CSV_MIME = "text/csv"
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

const stamp = () => new Date().toISOString().slice(0, 10)

/** FR-DAT: the whole household as one file, spreadsheets per record kind, and CSV bank statements in. */
export function useDataScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const [message, setMessage] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>) {
    try {
      await action()
    } catch (e) {
      setMessage(describeError(e))
    }
  }

  async function exportAll() {
    if (!session) return
    const name = `mizan-${session.householdName.replace(/\s+/g, "-")}-${stamp()}.json`
    await shareFile(name, JSON.stringify(await buildExport(session), null, 2), JSON_MIME)
  }

  async function importAll() {
    const text = await pickTextFile([JSON_MIME, "public.json"])
    if (text === null) return
    let preview
    try {
      preview = validateImport(JSON.parse(text))
    } catch (e) {
      setMessage(e instanceof ImportError ? t("data.invalid", { reason: e.message }) : t("data.notJson"))
      return
    }
    const name = (table: string) => t(`sync.tables.${table}`, { defaultValue: table })
    const lines = Object.entries(preview.counts).map(([table, count]) => `${name(table)}: ${count}`)
    if (preview.skipped.length > 0) lines.push(t("data.skipped", { tables: preview.skipped.map(name).join(", ") }))
    Alert.alert(t("data.previewTitle"), `${t("data.previewBody")}\n\n${lines.join("\n")}`, [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("data.confirmImport"), onPress: () => void run(async () => setMessage(t("data.imported", { count: await applyImport(preview) }))) },
    ])
  }

  async function exportTable(kind: ExportKind, format: "csv" | "xlsx") {
    const table = await exportTableFor(kind, EXPORT_COLUMNS[kind].map((key) => t(`exports.columns.${key}`)))
    const name = `mizan-${kind}-${stamp()}.${format}`
    if (format === "csv") await shareFile(name, toCsv(table), CSV_MIME)
    else await shareFile(name, toXlsx(table, t(`exports.${kind}`), i18n.language === "ar", zipSync), XLSX_MIME)
  }

  async function importCsv() {
    const text = await pickTextFile([CSV_MIME, "text/comma-separated-values", "public.comma-separated-values-text"])
    if (text === null) return
    setPendingCsv(text)
    router.push("/csv-import")
  }

  return {
    message,
    writes: mayWriteRecords(session?.role ?? "OWNER"),
    exportAll: () => void run(exportAll),
    importAll: () => void run(importAll),
    importCsv: () => void run(importCsv),
    kinds: EXPORT_KINDS.map((kind) => ({
      kind,
      label: t(`exports.${kind}`),
      csv: () => void run(() => exportTable(kind, "csv")),
      xlsx: () => void run(() => exportTable(kind, "xlsx")),
    })),
  }
}

export type DataScreenModel = ReturnType<typeof useDataScreen>
