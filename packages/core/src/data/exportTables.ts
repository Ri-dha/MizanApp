import { todayIso } from "../domain/calendar/month"
import { rows } from "../store/store"
import { assetsTable, lotsTable, transactionsTable, type Table } from "./tabular"

export type ExportKind = "transactions" | "metals" | "assets"
export const EXPORT_KINDS: ExportKind[] = ["transactions", "metals", "assets"]

/** The column keys of each spreadsheet; each app translates them under `exports.columns`. */
export const EXPORT_COLUMNS: Record<ExportKind, string[]> = {
  transactions: ["date", "type", "amount", "currency", "baseAmount", "bucket", "category", "payee", "note"],
  metals: ["date", "metal", "purity", "form", "weightGrams", "remainingGrams", "metalCost", "makingCharge", "fees", "currency", "dealer", "note"],
  assets: ["name", "type", "status", "purchaseDate", "purchasePrice", "currency", "value", "valuedOn", "liquidity", "soldOn", "salePrice"],
}

export async function exportTableFor(kind: ExportKind, labels: string[]): Promise<Table> {
  const live = <T extends { deletedAt: string | null }>(row: T) => row.deletedAt === null
  if (kind === "transactions") {
    const [transactions, buckets] = await Promise.all([rows("transactions", live), rows("buckets")])
    return transactionsTable(transactions.sort((a, b) => (a.occurredOn < b.occurredOn ? -1 : 1)), buckets, labels)
  }
  if (kind === "metals") {
    const [lots, disposalLots] = await Promise.all([rows("metalLots", live), rows("metalDisposalLots", live)])
    return lotsTable(lots, disposalLots, labels)
  }
  const [assets, valuations] = await Promise.all([rows("assets", live), rows("assetValuations", live)])
  return assetsTable(assets, valuations, todayIso(), labels)
}
