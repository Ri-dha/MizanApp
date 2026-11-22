import { router } from "expo-router"
import { useTranslation } from "react-i18next"

import { currentAmount, updateIncomeSource } from "@mizan/core/db/income"
import { todayIso } from "@mizan/core/domain/calendar/month"
import type { IncomeSource } from "@mizan/core/schema"
import { useSession } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMonthView } from "@/hooks/use-views"
import { useScreenTour } from "@/tours"
import { formatDay } from "@/utils/dates"
import { formatMoney } from "@/utils/money"

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }

/** Everything the Income screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useIncomeScreen() {
  const { t, i18n } = useTranslation()
  useScreenTour("income")
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const base = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const today = todayIso()
  const money = (amount: number, currency = base) => formatMoney(amount, currency, i18n.language)
  const date = (iso: string) => formatDay(iso, i18n.language, DAY_MONTH)
  const openReceipt = (params: Record<string, string>) => router.push({ pathname: "/income-receipt", params: { monthKey, ...params } })

  function sourceLine(source: IncomeSource) {
    const ended = source.activeTo !== null && source.activeTo < today
    const parts = [t(`income.frequencies.${source.frequency}`)]
    if (source.frequency === "MONTHLY") parts.push(t("income.payDayShort", { day: source.payDay }))
    if (source.activeTo) parts.push(ended ? t("income.ended") : t("income.endsOn", { date: date(source.activeTo) }))
    return parts.join(" · ")
  }

  const { planned, received } = view.income
  return {
    monthKey, setMonthKey,
    planned: money(planned),
    received: money(received),
    receivedPercent: planned > 0 ? Math.min(100, Math.round((received / planned) * 100)) : received > 0 ? 100 : 0,
    allReceived: planned > 0 && received >= planned,
    addSource: () => router.push("/income-source"),
    addIrregular: () => openReceipt({}),
    occurrences: view.occurrences.map((occurrence) => {
      const receipt = occurrence.receipt
      return {
        key: `${occurrence.source.id}-${occurrence.date}`,
        sourceId: occurrence.source.id,
        receiptId: receipt?.id ?? null,
        name: occurrence.source.name,
        detail: receipt ? t("income.receivedOn", { date: date(receipt.receivedOn) }) : t("income.expectedOn", { date: date(occurrence.date) }),
        amount: money(receipt?.baseAmount ?? occurrence.amount),
        overdue: !receipt && occurrence.date < today,
        open: () => (receipt ? openReceipt({ receiptId: receipt.id }) : openReceipt({ sourceId: occurrence.source.id, date: occurrence.date })),
      }
    }),
    irregular: view.receipts.filter((r) => !view.occurrences.some((o) => o.receipt?.id === r.id)).map((receipt) => ({
      id: receipt.id,
      name: receipt.note || t("income.irregular"),
      detail: t("income.receivedOn", { date: date(receipt.receivedOn) }),
      amount: money(receipt.baseAmount),
      href: { pathname: "/income-receipt" as const, params: { monthKey, receiptId: receipt.id } },
    })),
    sources: view.sources.map((source) => ({
      id: source.id,
      name: source.name,
      detail: sourceLine(source),
      amount: money(currentAmount(source, view.amountHistory, today), source.currency),
      href: { pathname: "/income-source" as const, params: { id: source.id } },
      end: !source.activeTo && source.frequency !== "ONE_OFF" ? () => void updateIncomeSource(source.id, { activeTo: today }) : null,
    })),
  }
}

export type IncomeScreenModel = ReturnType<typeof useIncomeScreen>
