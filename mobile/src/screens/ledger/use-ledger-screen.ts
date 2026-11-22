import { router } from "expo-router"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { isAccountTransfer } from "@mizan/core/db/cashMovements"
import { monthFlow } from "@mizan/core/db/monthView"
import { EMPTY_FILTER, filterTransactions, liveRecentlyDeleted, liveTransactionsFor, restoreTransaction } from "@mizan/core/db/transactions"
import type { LedgerTransaction, TransactionType } from "@mizan/core/schema"
import { useLiveQuery, useSession, useSyncStatus } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMonthView } from "@/hooks/use-views"
import { useScreenTour } from "@/tours"
import { formatDay } from "@/utils/dates"
import { formatMoney } from "@/utils/money"

const NO_ROWS: LedgerTransaction[] = []
const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }
export const TYPE_FILTERS: (TransactionType | null)[] = [null, "EXPENSE", "TRANSFER", "INCOME"]

export interface LedgerRow {
  id: string
  title: string
  detail: string
  amount: string
  /** Money in, money out, or a move between the person's own accounts. */
  flow: "in" | "out" | "moved"
  bucketColour: string | null
  /** One part of a spend split across buckets; a view marks it. */
  split: boolean
  open: () => void
  restore: () => void
}

export interface LedgerSection {
  key: string
  title: string
  data: LedgerRow[]
  deleted?: boolean
}

/** Everything the Ledger tab knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useLedgerScreen() {
  const { t, i18n } = useTranslation()
  useScreenTour("ledger")
  const session = useSession()
  const status = useSyncStatus()
  const startDay = session?.monthStartDay ?? 1
  const base = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const [text, setText] = useState("")
  const [typeFilter, setTypeFilter] = useState<TransactionType | null>(null)
  const view = useMonthView(monthKey, startDay)
  const month = useLiveQuery(() => liveTransactionsFor(monthKey), [monthKey], NO_ROWS)
  const deleted = useLiveQuery(liveRecentlyDeleted, [], NO_ROWS)
  const accounts = useLiveQuery(liveCashAccounts, [], [])

  const sections = useMemo<LedgerSection[]>(() => {
    const accountName = (id: string | null | undefined) => accounts.find((a) => a.id === id)?.name ?? "?"
    const rowOf = (row: LedgerTransaction): LedgerRow => {
      const moved = isAccountTransfer(row)
      const bucket = view.buckets.find((b) => b.id === row.bucketId)
      // A move between the person's own accounts is neither spending nor income, so it carries no sign.
      const signed = row.type === "INCOME" || moved ? row.amount : -row.amount
      return {
        id: row.id,
        title: moved ? `${accountName(row.cashAccountId)} → ${accountName(row.counterpartyId)}` : row.payee ?? row.category ?? t(`transactions.types.${row.type}`),
        detail: [moved ? t("transactions.types.TRANSFER") : bucket?.name, row.category, row.note].filter(Boolean).join(" · ") || " ",
        amount: formatMoney(signed, row.currency, i18n.language),
        flow: moved ? "moved" : row.type === "INCOME" ? "in" : "out",
        bucketColour: moved ? null : bucket?.colour ?? null,
        split: !!row.splitGroupId,
        open: () => router.push({ pathname: moved ? "/account-transfer" : "/transaction", params: { id: row.id } }),
        restore: () => void restoreTransaction(row.id),
      }
    }
    const matching = filterTransactions(month, { ...EMPTY_FILTER, text, type: typeFilter })
    const byDay = new Map<string, LedgerTransaction[]>()
    for (const row of matching) byDay.set(row.occurredOn, [...(byDay.get(row.occurredOn) ?? []), row])
    const days: LedgerSection[] = [...byDay.entries()].map(([day, data]) => ({ key: day, title: formatDay(day, i18n.language, DAY), data: data.map(rowOf) }))
    return deleted.length > 0 && !text && !typeFilter ? [...days, { key: "deleted", title: t("transactions.recentlyDeleted"), data: deleted.map(rowOf), deleted: true }] : days
  }, [month, deleted, text, typeFilter, accounts, view.buckets, i18n.language, t])

  const flow = monthFlow(view)
  return {
    // Viewers and advisors read only, as on the web; the server refuses their writes in any case.
    canWrite: session?.role !== "VIEWER" && session?.role !== "ADVISOR",
    verifyNotice: session && !session.verified ? `${t("auth.verifyTitle")} · ${t("auth.verify")}` : null,
    monthKey, setMonthKey, setText, typeFilter, setTypeFilter, sections,
    typeLabels: TYPE_FILTERS.map((value) => (value ? t(`transactions.types.${value}`) : t("transactions.allTypes"))),
    statusText: status.pending > 0 ? t("sync.status.pending", { count: status.pending }) : t(`sync.status.${status.phase}`),
    received: formatMoney(flow.received, base, i18n.language),
    spent: formatMoney(flow.spent, base, i18n.language),
    add: () => router.push("/transaction"),
  }
}

export type LedgerScreenModel = ReturnType<typeof useLedgerScreen>
