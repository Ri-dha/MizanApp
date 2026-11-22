import { router } from "expo-router"
import { useTranslation } from "react-i18next"

import { liveRecurringExpenses, undoBillPaid } from "@mizan/core/db/expenses"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { subscriptionSummary } from "@mizan/core/domain/expense/subscriptions"
import type { RecurringExpense } from "@mizan/core/schema"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMetals, useMonthView } from "@/hooks/use-views"
import { useScreenTour } from "@/tours"
import { formatDay } from "@/utils/dates"
import { formatMoney } from "@/utils/money"

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }

const editHref = (expense: RecurringExpense) => ({ pathname: "/bill-edit" as const, params: { id: expense.id } })

/** Everything the Bills screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useBillsScreen() {
  const { t, i18n } = useTranslation()
  useScreenTour("bills")
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const base = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const expenses = useLiveQuery(liveRecurringExpenses, [], [])
  const { prices } = useMetals()
  const today = todayIso()
  const money = (amount: number, currency = base) => formatMoney(amount, currency, i18n.language)
  const date = (iso: string) => formatDay(iso, i18n.language, DAY_MONTH)
  const bucketOf = (id: string | null) => view.buckets.find((b) => b.id === id)
  const withBucket = (text: string, id: string | null) => (bucketOf(id) ? `${text} · ${bucketOf(id)?.name}` : text)
  const frequency = (expense: RecurringExpense) => t(`bills.frequencies.${expense.frequency}`)
  const shown = new Set(view.bills.map((b) => b.expense.id))
  const thisMonth = [...new Map(view.bills.map((b) => [b.expense.id, b.expense])).values()]
  const subscriptions = subscriptionSummary(expenses, today, prices.usdBaseMicros)

  const bills = view.bills.map((bill) => {
    const occurrence = bill.occurrence
    const estimate = bill.expense.isEstimate && !occurrence
    return {
      key: `${bill.expense.id}-${bill.dueDate}`,
      id: bill.expense.id,
      name: bill.expense.name,
      colour: bucketOf(bill.expense.bucketId)?.colour ?? null,
      detail: withBucket(occurrence ? t("bills.paidOn", { date: date(occurrence.paidOn) }) : t("bills.dueOn", { date: date(bill.dueDate) }), bill.expense.bucketId),
      amount: `${estimate ? "≈ " : ""}${money(occurrence?.actualAmount ?? bill.expectedAmount)}`,
      state: occurrence ? ("paid" as const) : bill.dueDate < today ? ("overdue" as const) : bill.dueDate === today ? ("today" as const) : ("upcoming" as const),
      estimate,
      pay: () => router.push({ pathname: "/bill-paid", params: { id: bill.expense.id, dueDate: bill.dueDate, monthKey } }),
      undo: occurrence ? () => void undoBillPaid(occurrence) : null,
    }
  })

  return {
    monthKey, setMonthKey, bills,
    stillDue: money(view.bills.filter((b) => !b.occurrence).reduce((sum, b) => sum + b.expectedAmount, 0)),
    paid: money(view.bills.reduce((sum, b) => sum + (b.occurrence?.actualAmount ?? 0), 0)),
    hasExpenses: expenses.length > 0,
    add: () => router.push("/bill-edit"),
    recurring: [
      ...thisMonth.map((expense) => ({
        id: expense.id, name: expense.name, href: editHref(expense),
        detail: withBucket(expense.isEstimate ? `${frequency(expense)} · ${t("bills.estimate")}` : frequency(expense), expense.bucketId),
        amount: money(expense.amount, expense.currency) as string | null,
      })),
      ...expenses.filter((e) => !shown.has(e.id)).map((expense) => ({
        id: expense.id, name: expense.name, href: editHref(expense),
        detail: `${frequency(expense)} · ${t("bills.notThisMonth")}`,
        amount: null as string | null,
      })),
    ],
    subscriptionsNote: subscriptions.lines.length === 0
      ? t("subscriptions.empty")
      : [
          t("subscriptions.totals", { monthly: money(subscriptions.monthlyBase), yearly: money(subscriptions.yearlyBase) }),
          subscriptions.monthlyUsd !== null ? t("subscriptions.totalsUsd", { monthly: money(subscriptions.monthlyUsd, "USD"), yearly: money(subscriptions.yearlyUsd ?? 0, "USD") }) : null,
        ].filter(Boolean).join(" · "),
    subscriptions: subscriptions.lines.map((line) => ({
      id: line.expense.id, name: line.expense.name, href: editHref(line.expense),
      perMonth: t("subscriptions.perMonth", { amount: money(line.monthlyBase) }),
      perYear: t("subscriptions.perYear", { amount: money(line.yearlyBase) }),
    })),
  }
}

export type BillsScreenModel = ReturnType<typeof useBillsScreen>
export type BillRow = BillsScreenModel["bills"][number]
