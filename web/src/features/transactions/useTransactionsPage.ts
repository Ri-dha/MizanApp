import { useLiveQuery } from "dexie-react-hooks"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { useDateFormat } from "@/app/dates"
import { formatMoney, toMinorUnits } from "@/app/money"
import { useSelectedMonth } from "@/app/month"
import type { LedgerTransaction, TransactionType } from "@/db/schema"
import { useMonthView } from "@/features/plan/useMonthFigures"
import { useScreenTour } from "@/tours/useTour"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { isAccountTransfer } from "@mizan/core/db/cashMovements"
import { EMPTY_FILTER, filterTransactions, liveRecentlyDeleted, restoreTransaction, type TransactionFilter } from "@mizan/core/db/transactions"

const PAGE_SIZE = 100

export const LEDGER_TYPES = ["EXPENSE", "TRANSFER", "INCOME"] as const

export interface LedgerRow {
  transaction: LedgerTransaction
  title: string
  detail: string
  bucketColour: string | undefined
  accountTransfer: boolean
}

export interface LedgerDay {
  date: string
  label: string
  /** Income less spending on the day; `moved` is what only changed place. */
  net: number
  moved: number
  rows: LedgerRow[]
}

export function useTransactionsPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const base = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const deleted = useLiveQuery(liveRecentlyDeleted, [], [])
  const cashAccounts = useLiveQuery(liveCashAccounts, [], [])
  const [filter, setFilter] = useState<TransactionFilter>(EMPTY_FILTER)
  const [editing, setEditing] = useState<LedgerTransaction | null | "new">(null)
  const [limit, setLimit] = useState(PAGE_SIZE)
  const formatDay = useDateFormat()
  useScreenTour("ledger")

  const money = (amount: number) => formatMoney(amount, base, i18n.language)
  const accountName = (id: string | null | undefined) => cashAccounts.find((a) => a.id === id)?.name ?? "?"
  const titleOf = (row: LedgerTransaction) => row.payee || row.category || t(`transactions.types.${row.type}`)

  const matching = filterTransactions(view.transactions, filter)
  const shown = matching.slice(0, limit)
  const days: LedgerDay[] = []
  for (const transaction of shown) {
    let day = days.find((d) => d.date === transaction.occurredOn)
    if (!day) {
      day = { date: transaction.occurredOn, label: formatDay(transaction.occurredOn, { weekday: "short", day: "numeric", month: "short" }), net: 0, moved: 0, rows: [] }
      days.push(day)
    }
    const bucket = view.buckets.find((b) => b.id === transaction.bucketId)
    const accountTransfer = isAccountTransfer(transaction)
    if (transaction.type === "INCOME") day.net += transaction.baseAmount
    else if (transaction.type === "EXPENSE") day.net -= transaction.baseAmount
    else day.moved += transaction.baseAmount
    day.rows.push({
      transaction,
      accountTransfer,
      bucketColour: bucket?.colour,
      title: accountTransfer ? `${accountName(transaction.cashAccountId)} → ${accountName(transaction.counterpartyId)}` : titleOf(transaction),
      detail: [bucket?.name, transaction.category, transaction.note].filter(Boolean).join(" · "),
    })
  }

  const sumOf = (type: TransactionType) => view.transactions.filter((tx) => tx.type === type).reduce((sum, tx) => sum + tx.baseAmount, 0)
  const editingTransfer = editing !== null && editing !== "new" && isAccountTransfer(editing) ? editing : null

  return {
    monthKey,
    setMonthKey,
    buckets: view.buckets,
    filter,
    setText: (text: string) => setFilter({ ...filter, text }),
    setBucket: (bucketId: string | null) => setFilter({ ...filter, bucketId }),
    setType: (type: TransactionType | null) => setFilter({ ...filter, type }),
    setMin: (text: string) => setFilter({ ...filter, minAmount: text ? toMinorUnits(text, base) : null }),
    setMax: (text: string) => setFilter({ ...filter, maxAmount: text ? toMinorUnits(text, base) : null }),
    totals: { received: sumOf("INCOME"), spent: sumOf("EXPENSE"), moved: sumOf("TRANSFER") },
    days,
    empty: matching.length === 0,
    shownCount: shown.length,
    matchingCount: matching.length,
    more: () => setLimit(limit + PAGE_SIZE),
    deleted: deleted.map((row) => ({ id: row.id, label: `${titleOf(row)} · ${money(row.baseAmount)}` })),
    restore: (id: string) => void restoreTransaction(id),
    money,
    open: (row: LedgerTransaction) => setEditing(row),
    close: () => setEditing(null),
    /** A move between two accounts opens its own sheet; everything else, and a new entry, the quick-add one. */
    quickAdd: { open: editing !== null && editingTransfer === null, transaction: editing === "new" || editingTransfer ? null : editing },
    transfer: { open: editingTransfer !== null, transfer: editingTransfer },
  }
}

export type TransactionsPageModel = ReturnType<typeof useTransactionsPage>
