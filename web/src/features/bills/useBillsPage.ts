import { useLiveQuery } from "dexie-react-hooks"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { formatWhen } from "@/app/dates"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/app/money"
import { useSelectedMonth } from "@/app/month"
import type { RecurringExpense } from "@/db/schema"
import { useMetals } from "@/features/metals/useMetals"
import { useMonthView } from "@/features/plan/useMonthFigures"
import { useScreenTour } from "@/tours/useTour"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { liveRecurringExpenses, markBillPaid, undoBillPaid, type BillDue } from "@mizan/core/db/expenses"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { subscriptionSummary } from "@mizan/core/domain/expense/subscriptions"

export const NO_ACCOUNT = "none"
const DAY_MS = 86_400_000

export function useBillsPage() {
  const { i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const base = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const all = useLiveQuery(liveRecurringExpenses, [], [])
  const accounts = useLiveQuery(liveCashAccounts, [], [])
  const { prices } = useMetals()
  const [editing, setEditing] = useState<RecurringExpense | null | "new">(null)
  const [paying, setPaying] = useState<BillDue | null>(null)
  const [actual, setActual] = useState("")
  const [paidOn, setPaidOn] = useState(todayIso())
  const [paidFrom, setPaidFrom] = useState(NO_ACCOUNT)
  useScreenTour("bills")
  const today = todayIso()

  const money = (amount: number, currency = base) => formatMoney(amount, currency, i18n.language)
  const date = (iso: string) => formatWhen(iso, i18n.language, { day: "numeric", month: "short" })
  const bucketOf = (id: string | null) => view.buckets.find((b) => b.id === id)
  const inMonth = new Set(view.bills.map((b) => b.expense.id))

  return {
    monthKey,
    setMonthKey,
    base,
    today,
    money,
    date,
    bucketOf,
    buckets: view.buckets,
    bills: view.bills,
    daysUntil: (iso: string) => Math.round((Date.parse(iso) - Date.parse(today)) / DAY_MS),
    stillDue: view.bills.filter((b) => !b.occurrence).reduce((sum, b) => sum + b.expectedAmount, 0),
    paid: view.bills.filter((b) => b.occurrence).reduce((sum, b) => sum + (b.occurrence?.actualAmount ?? 0), 0),
    recurring: [...new Map(view.bills.map((b) => [b.expense.id, b.expense])).values()],
    /** Bills that exist but have no due date this month (ended, quarterly, annual) still need to be reachable. */
    outsideMonth: all.filter((e) => !inMonth.has(e.id)),
    subscriptions: subscriptionSummary(all, today, prices.usdBaseMicros),
    editing,
    edit: (expense: RecurringExpense) => setEditing(expense),
    add: () => setEditing("new"),
    closeEditor: () => setEditing(null),
    undo: (bill: BillDue) => bill.occurrence && void undoBillPaid(bill.occurrence),
    accounts,
    paying,
    actual,
    setActual,
    paidOn,
    setPaidOn,
    paidFrom: accounts.some((a) => a.id === paidFrom) ? paidFrom : NO_ACCOUNT,
    setPaidFrom,
    startPaying(bill: BillDue) {
      setPaying(bill)
      setActual(fromMinorUnits(bill.expense.amount, bill.expense.currency))
      setPaidOn(bill.dueDate <= today ? bill.dueDate : today)
    },
    cancelPaying: () => setPaying(null),
    async confirmPaid(event: FormEvent) {
      event.preventDefault()
      if (!paying) return
      await markBillPaid(paying, monthKey, toMinorUnits(actual, paying.expense.currency), paidOn, accounts.some((a) => a.id === paidFrom) ? paidFrom : null)
      setPaying(null)
    },
  }
}

export type BillsPageModel = ReturnType<typeof useBillsPage>
