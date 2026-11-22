import { useState } from "react"
import { useTranslation } from "react-i18next"

import { trailingSavingRate, yearSummary, type YearSummary } from "@mizan/core/db/report"
import { formatMoney } from "@/utils/money"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey } from "@/hooks/use-views"
import { shareReportPdf } from "@/platform/report-pdf"
import { formatMonthKey } from "@/utils/month"
import { formatWhen } from "@/utils/dates"

const TOP_CATEGORIES = 8

/** FR-RPT-03/04/05: the year at a glance, spending per bucket and category, saving rate. */
export function useYearReportScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const thisMonth = currentMonthKey(startDay)
  const [year, setYear] = useState(Number(thisMonth.slice(0, 4)))
  const uncategorised = t("report.uncategorised")
  const summary = useLiveQuery(() => yearSummary(year, startDay, uncategorised), [year, startDay, uncategorised], undefined as YearSummary | undefined)
  const trailing = useLiveQuery(() => trailingSavingRate(thisMonth, startDay), [thisMonth, startDay], null)
  const money = (v: number) => formatMoney(v, base, i18n.language)
  const categories = summary ? Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).slice(0, TOP_CATEGORIES) : []
  const bucketIds = summary ? [...new Set(summary.months.flatMap((m) => Object.keys(m.byBucket)))] : []
  const bucketName = (id: string) => summary?.months.map((m) => m.bucketNames[id]).find(Boolean) ?? id
  const bucketTotal = (id: string) => summary?.months.reduce((s, m) => s + (m.byBucket[id] ?? 0), 0) ?? 0
  const monthShort = (key: string) => formatWhen(Date.UTC(year, Number(key.slice(5, 7)) - 1, 1), i18n.language, { month: "short" })
  const hasNetWorth = summary?.netWorthStart != null && summary?.netWorthEnd != null

  function savePdf() {
    if (!summary) return
    return shareReportPdf(`mizan-report-${year}`, t("report.yearTitle", { year }), session?.householdName ?? "", [
      {
        heading: t("report.summary"),
        rows: [
          [t("income.received"), money(summary.received)],
          [t("plan.spent"), money(summary.spent)],
          [t("report.saved"), money(summary.saved)],
          [t("report.rate"), summary.savingRate === null ? "—" : `${summary.savingRate}%`],
          [t("report.netWorthChange"), hasNetWorth ? money(summary.netWorthEnd! - summary.netWorthStart!) : t("report.noSnapshots")],
        ],
      },
      { heading: t("report.months"), rows: summary.months.map((m) => [formatMonthKey(m.key, i18n.language), `${money(m.received)} · ${money(m.spent)} · ${money(m.saved)}`]) },
      { heading: t("report.spendingByBucket"), rows: bucketIds.map((id) => [bucketName(id), money(bucketTotal(id))]) },
      { heading: t("report.topCategories"), rows: categories.map(([name, amount]) => [name, money(amount)]) },
    ], i18n.language === "ar")
  }

  return { year, setYear, thisMonth, summary, trailing, money, categories, bucketIds, bucketName, bucketTotal, monthShort, hasNetWorth, monthLabel: (key: string) => formatMonthKey(key, i18n.language), savePdf: () => void savePdf() }
}

export type YearReportModel = ReturnType<typeof useYearReportScreen>
