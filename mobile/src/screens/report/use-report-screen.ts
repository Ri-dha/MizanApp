import { useTranslation } from "react-i18next"

import { monthFlow, type MonthView } from "@mizan/core/db/monthView"
import { savingRate, spentByCategory } from "@mizan/core/db/report"
import { shiftKey } from "@mizan/core/domain/calendar/month"
import { useAppMode } from "@/hooks/use-app-mode"
import { useSession } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMonthView } from "@/hooks/use-views"
import { shareReportPdf } from "@/platform/report-pdf"
import { formatMoney } from "@/utils/money"
import { formatMonthKey } from "@/utils/month"

const TOP_CATEGORIES = 5
const FULL = 100

const bucketSpent = (view: MonthView) => view.figures.buckets.reduce((s, b) => s + b.spent, 0)

/** FR-RPT-02: planned versus actual per bucket, the biggest categories, and the change from last month. */
export function useReportScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const month = useMonthView(monthKey, startDay)
  const previous = useMonthView(shiftKey(monthKey, -1), startDay)
  const money = (v: number) => formatMoney(v, base, i18n.language)
  const signed = (v: number) => (v > 0 ? "+" : "") + money(v)
  const simple = useAppMode() === "simple"
  // Simple mode has no buckets, so its month is everything that came in and went out (ADR mode-1).
  const spentIn = (view: MonthView) => (simple ? monthFlow(view).spent : bucketSpent(view))
  const spent = spentIn(month)
  const received = simple ? monthFlow(month).received : month.income.received
  const rate = savingRate(received, spent)
  const change = spent - spentIn(previous)
  const categories = Object.entries(spentByCategory(month.transactions, t("report.uncategorised"))).sort((a, b) => b[1] - a[1]).slice(0, TOP_CATEGORIES)
  const largest = categories[0]?.[1] ?? 0
  const buckets = month.figures.buckets.map((figure) => {
    const bucket = month.buckets.find((b) => b.id === figure.id)
    const actual = figure.spent + figure.transfersOut
    return {
      id: figure.id,
      name: bucket?.name ?? "",
      colour: bucket?.colour ?? null,
      actual: money(actual),
      allocated: money(figure.allocated),
      percent: figure.allocated > 0 ? Math.min(FULL, Math.round((actual * FULL) / figure.allocated)) : 0,
      over: actual > figure.allocated,
    }
  })

  function savePdf() {
    return shareReportPdf(`mizan-report-${monthKey}`, `${t("report.title")} · ${formatMonthKey(monthKey, i18n.language)}`, session?.householdName ?? "", [
      {
        heading: t("report.summary"),
        rows: [
          [t("income.received"), money(received)],
          [t("plan.spent"), money(spent)],
          ...(rate !== null ? [[t("report.rate"), `${rate}%`] as [string, string]] : []),
          [t("report.monthOverMonth", { delta: "" }).replace(/[:：]?\s*$/, ""), signed(change)],
        ],
      },
      ...(simple ? [] : [{
        heading: t("report.plannedVsActual"),
        rows: buckets.map((b): [string, string] => [b.name, `${b.actual} / ${b.allocated}`]),
      }]),
      { heading: t("report.topCategories"), rows: categories.map(([name, amount]) => [name, money(amount)]) },
    ], i18n.language === "ar")
  }

  return {
    monthKey, setMonthKey, simple, rate, buckets,
    received: money(received),
    spent: money(spent),
    change: signed(change),
    spendingUp: change > 0,
    categories: categories.map(([name, amount]) => ({ name, amount: money(amount), percent: largest > 0 ? Math.round((amount * FULL) / largest) : 0 })),
    savePdf: () => void savePdf(),
  }
}

export type ReportScreenModel = ReturnType<typeof useReportScreen>
