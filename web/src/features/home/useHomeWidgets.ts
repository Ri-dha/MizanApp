import { useLiveQuery } from "dexie-react-hooks"
import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { useAppMode } from "@/app/appMode"
import { formatMoney } from "@/app/money"
import { currentMonthKey } from "@/app/month"
import { useAccountsNow } from "@/features/accounts/useAccountsNow"
import { useMetals } from "@/features/metals/useMetals"
import { useNetWorth } from "@/features/networth/useNetWorth"
import { monthFlow, useMonthView } from "@/features/plan/useMonthFigures"
import { totalsByCurrency } from "@mizan/core/db/cashAccounts"
import { balanceOf, liveDebts, livePayments } from "@mizan/core/db/debts"
import { liveDeposits, liveGoals, savedOf } from "@mizan/core/db/goals"
import { pickedFrom, type HomeWidget } from "@mizan/core/db/homeLayout"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { goalProjection } from "@mizan/core/domain/goal/projection"

/** The figures behind each Home card, one hook per kind; every template draws them its own way. */

export function useHomeMoney() {
  const { i18n } = useTranslation()
  const base = useSession()?.baseCurrency ?? "IQD"
  return { base, money: (v: number, currency = base) => formatMoney(v, currency, i18n.language) }
}

function useCurrentMonth() {
  const startDay = useSession()?.monthStartDay ?? 1
  return useMonthView(currentMonthKey(startDay), startDay)
}

export function useNetWorthWidget(widget: HomeWidget) {
  const worth = useNetWorth()
  const simple = useAppMode() === "simple"
  return {
    simple,
    byClass: widget.options.breakdown === "classes",
    netWorth: worth.current.netWorth,
    totalAssets: worth.current.totalAssets,
    totalLiabilities: worth.current.totalLiabilities,
    classes: worth.current.composition.filter((c) => c.amount !== 0),
    // Simple mode still counts what was recorded in advanced mode, and says so, so the total never changes with the mode.
    hiddenCounted: simple && worth.current.composition.some((c) => c.amount !== 0 && c.assetClass !== "CASH" && c.assetClass !== "RECEIVABLES"),
  }
}

export function useMonthWidget() {
  const flow = monthFlow(useCurrentMonth())
  return { ...flow, spentPercent: flow.received > 0 ? Math.min(100, Math.round((flow.spent * 100) / flow.received)) : 0 }
}

export function usePlanWidget(widget: HomeWidget) {
  const month = useCurrentMonth()
  const figure = widget.options.figure as "free" | "spent" | "allocated"
  const rows = month.figures.buckets.map((b) => {
    const bucket = month.buckets.find((x) => x.id === b.id)
    const used = b.spent + b.committed
    return {
      id: b.id,
      name: bucket?.name ?? "—",
      colour: bucket?.colour,
      value: b[figure],
      usedPercent: b.allocated > 0 ? Math.min(100, Math.round((used * 100) / b.allocated)) : used > 0 ? 100 : 0,
    }
  })
  return { figure, rows, total: rows.reduce((sum, r) => sum + r.value, 0), planned: month.income.planned, received: month.income.received }
}

export function useMetalsWidget(widget: HomeWidget) {
  const metals = useMetals()
  const showGain = widget.options.show === "gain"
  const total = metals.lines.reduce((acc, l) => ({ value: acc.value + l.valueNow, gain: acc.gain + l.gain }), { value: 0, gain: 0 })
  return { showGain, empty: metals.lines.length === 0, value: total.value, gain: total.gain, shown: showGain ? total.gain : total.value }
}

export function useBillsWidget(widget: HomeWidget) {
  const month = useCurrentMonth()
  const upcoming = month.bills.filter((b) => !b.occurrence)
  return {
    today: todayIso(),
    due: upcoming.reduce((sum, b) => sum + b.expectedAmount, 0),
    none: upcoming.length === 0,
    listed: upcoming.slice(0, Number(widget.options.count)),
  }
}

export function useCashWidget(widget: HomeWidget) {
  const accounts = pickedFrom(widget, useAccountsNow())
  const wanted = widget.options.currency
  const totals = Object.entries(totalsByCurrency(accounts)).filter(([currency]) => wanted === "all" || currency === wanted)
  // Shares only mean something inside one currency, so the split is offered when a single total is shown.
  const single = totals.length === 1 && totals[0][1] > 0 ? totals[0] : null
  const shares = single
    ? accounts.filter((a) => a.currency === single[0] && a.balance > 0).map((a) => ({ id: a.id, name: a.name, percent: (a.balance * 100) / single[1] }))
    : []
  return { count: accounts.length, totals, shares }
}

export function useGoalsWidget(widget: HomeWidget) {
  const goals = useLiveQuery(liveGoals, [], [])
  const deposits = useLiveQuery(liveDeposits, [], [])
  const today = todayIso()
  const active = pickedFrom(widget, goals.filter((g) => g.status === "ACTIVE")).slice(0, Number(widget.options.count))
  return active.map((goal) => ({ id: goal.id, name: goal.name, percent: goalProjection(goal.targetAmount, savedOf(goal, deposits), goal.monthlyContribution, goal.targetDate, today).percent }))
}

export function useDebtsWidget(widget: HomeWidget) {
  const debts = useLiveQuery(liveDebts, [], [])
  const payments = useLiveQuery(livePayments, [], [])
  const direction = widget.options.direction
  const listed = pickedFrom(widget, debts.filter((d) => d.status === "ACTIVE" && d.direction === direction))
  return { direction, rows: listed.map((d) => ({ id: d.id, name: d.name, balance: balanceOf(d, payments), currency: d.currency })) }
}
