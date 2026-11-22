import { useLiveQuery } from "dexie-react-hooks"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { formatWhen } from "@/app/dates"
import { formatMoney } from "@/app/money"
import { currentMonthKey, formatMonthKey } from "@/app/month"
import { trailingSavingRate, yearSummary, type YearSummary } from "@mizan/core/db/report"

const TOP_CATEGORIES = 8
const MONTHS_IN_YEAR = 12

/** FR-RPT-03/04/05: the year at a glance, spending trends per bucket and category, saving rate. */
export function useYearReportPage() {
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

  const bucketIds = summary ? [...new Set(summary.months.flatMap((m) => Object.keys(m.byBucket)))] : []
  const tallest = Math.max(1, ...(summary?.months.map((m) => bucketIds.reduce((sum, id) => sum + (m.byBucket[id] ?? 0), 0)) ?? []))
  const categories = summary ? Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).slice(0, TOP_CATEGORIES) : []
  const top = categories[0]?.[1] ?? 0

  return {
    year,
    previousYear: () => setYear(year - 1),
    nextYear: () => setYear(year + 1),
    print: () => window.print(),
    money,
    summary,
    trailing,
    monthlyAverage: summary ? Math.round(summary.spent / MONTHS_IN_YEAR) : 0,
    buckets: bucketIds.map((id) => ({ id, name: summary?.months.map((m) => m.bucketNames[id]).find(Boolean) ?? id })),
    /** Each month as a column: one segment per bucket, as a share of the year's tallest month. */
    columns: summary?.months.map((m) => ({
      key: m.key,
      label: formatWhen(Date.UTC(year, Number(m.key.slice(5, 7)) - 1, 1), i18n.language, { month: "short" }),
      segments: bucketIds.map((id) => ({ id, amount: m.byBucket[id] ?? 0, percent: ((m.byBucket[id] ?? 0) * 100) / tallest })),
    })) ?? [],
    months: summary?.months.map((m) => ({ ...m, label: formatMonthKey(m.key, i18n.language), current: m.key === thisMonth })) ?? [],
    categories: categories.map(([name, amount]) => ({ name, amount, percent: top > 0 ? Math.round((amount * 100) / top) : 0 })),
  }
}

export type YearReportPageModel = ReturnType<typeof useYearReportPage>
