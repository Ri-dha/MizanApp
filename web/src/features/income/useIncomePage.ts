import { useLiveQuery } from "dexie-react-hooks"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { formatWhen } from "@/app/dates"
import { formatMoney } from "@/app/money"
import { useSelectedMonth } from "@/app/month"
import type { IncomeReceipt, IncomeSource } from "@/db/schema"
import { useMonthView } from "@/features/plan/useMonthFigures"
import { useScreenTour } from "@/tours/useTour"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { currentAmount, updateIncomeSource } from "@mizan/core/db/income"
import { todayIso } from "@mizan/core/domain/calendar/month"
import type { ReceiptDraft } from "./ReceiptSheet"

export function useIncomePage() {
  const { i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const base = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const accounts = useLiveQuery(liveCashAccounts, [], [])
  const [editingSource, setEditingSource] = useState<IncomeSource | null | "new">(null)
  const [receipt, setReceipt] = useState<ReceiptDraft | null>(null)
  useScreenTour("income")
  const today = todayIso()
  const { planned, received } = view.income

  return {
    monthKey,
    setMonthKey,
    today,
    money: (amount: number, currency = base) => formatMoney(amount, currency, i18n.language),
    date: (iso: string) => formatWhen(iso, i18n.language, { day: "numeric", month: "short" }),
    planned,
    received,
    receivedPercent: planned > 0 ? Math.min(100, Math.round((received * 100) / planned)) : received > 0 ? 100 : 0,
    allIn: planned > 0 && received >= planned,
    occurrences: view.occurrences,
    irregular: view.receipts.filter((r) => !view.occurrences.some((o) => o.receipt?.id === r.id)),
    sources: view.sources.map((source) => ({
      source,
      ended: source.activeTo !== null && source.activeTo < today,
      amount: currentAmount(source, view.amountHistory, today),
      goesTo: (source.intoAccounts ?? []).map((share) => accounts.find((a) => a.id === share.cashAccountId)?.name).filter(Boolean).join(", "),
      canEnd: !source.activeTo && source.frequency !== "ONE_OFF",
    })),
    amountHistory: view.amountHistory,
    editingSource,
    addSource: () => setEditingSource("new"),
    editSource: (source: IncomeSource) => setEditingSource(source),
    closeSource: () => setEditingSource(null),
    endSource: (source: IncomeSource) => void updateIncomeSource(source.id, { activeTo: today }),
    receipt,
    closeReceipt: () => setReceipt(null),
    addIrregular: () => setReceipt({ existing: null, incomeSourceId: null, monthKey, receivedOn: today, amount: 0, currency: base, fxRateMicros: 1_000_000 }),
    markReceived(source: IncomeSource, occurrenceDate: string) {
      setReceipt({
        existing: null,
        incomeSourceId: source.id,
        monthKey,
        receivedOn: occurrenceDate <= today ? occurrenceDate : today,
        amount: source.amount,
        currency: source.currency,
        fxRateMicros: source.fxRateMicros,
        intoAccounts: source.intoAccounts,
      })
    },
    editReceipt(existing: IncomeReceipt) {
      setReceipt({ existing, incomeSourceId: existing.incomeSourceId, monthKey, receivedOn: existing.receivedOn, amount: existing.amount, currency: existing.currency, fxRateMicros: existing.fxRateMicros, intoAccounts: existing.intoAccounts })
    },
  }
}

export type IncomePageModel = ReturnType<typeof useIncomePage>
