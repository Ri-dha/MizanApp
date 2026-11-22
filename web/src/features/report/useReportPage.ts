import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { useAppMode } from "@/app/appMode"
import { formatMoney } from "@/app/money"
import { shiftMonth, useSelectedMonth } from "@/app/month"
import { monthFlow, useMonthView } from "@/features/plan/useMonthFigures"

const TOP_CATEGORIES = 5

/** FR-RPT-02: planned versus actual per bucket, the biggest categories, and the change from last month. */
export function useReportPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const month = useMonthView(monthKey, startDay)
  const previous = useMonthView(shiftMonth(monthKey, -1), startDay)
  const simple = useAppMode() === "simple"
  const money = (v: number) => formatMoney(v, base, i18n.language)

  // Simple mode has no buckets, so its month is everything that came in and went out (ADR mode-1).
  const spentOf = (view: typeof month) => (simple ? monthFlow(view).spent : view.figures.buckets.reduce((s, b) => s + b.spent, 0))
  const received = simple ? monthFlow(month).received : month.income.received
  const spent = spentOf(month)
  const delta = spent - spentOf(previous)
  const categories = Object.entries(
    month.transactions.filter((tx) => tx.type === "EXPENSE").reduce<Record<string, number>>((acc, tx) => {
      const key = tx.category ?? t("report.uncategorised")
      acc[key] = (acc[key] ?? 0) + tx.baseAmount
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, TOP_CATEGORIES)
  const top = categories[0]?.[1] ?? 0

  return {
    monthKey,
    setMonthKey,
    simple,
    money,
    signed: (v: number) => (v > 0 ? "+" : "") + money(v),
    received,
    spent,
    spentShare: received > 0 ? Math.round((spent * 100) / received) : null,
    savingRate: received > 0 ? Math.round(((received - spent) * 1000) / received) / 10 : null,
    delta,
    buckets: month.figures.buckets.map((figure) => {
      const bucket = month.buckets.find((b) => b.id === figure.id)!
      const actual = figure.spent + figure.transfersOut
      return {
        id: figure.id,
        name: bucket.name,
        colour: bucket.colour,
        actual,
        allocated: figure.allocated,
        over: actual > figure.allocated,
        percent: figure.allocated > 0 ? Math.min(100, Math.round((actual * 100) / figure.allocated)) : 0,
      }
    }),
    categories: categories.map(([name, amount]) => ({ name, amount, percent: top > 0 ? Math.round((amount * 100) / top) : 0 })),
    print: () => window.print(),
  }
}

export type ReportPageModel = ReturnType<typeof useReportPage>
