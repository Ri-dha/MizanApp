import { zipSync } from "fflate"

import { toXlsx as toXlsxWith, type Table } from "@mizan/core/data/tabular"

export { assetsTable, lotsTable, toCsv, transactionsTable, type Cell, type Table } from "@mizan/core/data/tabular"

export const toXlsx = (table: Table, sheetName: string, rtl: boolean) => toXlsxWith(table, sheetName, rtl, zipSync)

export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
