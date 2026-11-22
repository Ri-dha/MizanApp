import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { YearReportPageModel } from "../useYearReportPage"

const card = "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
const heading = "font-sans text-base font-semibold"
const label = "font-sans text-[13px] font-semibold text-muted-foreground"
const figure = "text-[26px] leading-8 font-semibold tabular-nums"
const meta = "text-[13px] text-muted-foreground tabular-nums"
const BUCKET_COLOURS = ["bg-bucket-1", "bg-bucket-2", "bg-bucket-3", "bg-bucket-4", "bg-bucket-5", "bg-bucket-6", "bg-bucket-7", "bg-bucket-8"]
const colourOf = (index: number) => BUCKET_COLOURS[index % BUCKET_COLOURS.length]

/** Soft: the year in a row of figures, spending as stacked columns, then the months and categories as tables. */
export default function YearReportSoft({ model }: { model: YearReportPageModel }) {
  const { t } = useTranslation()
  const { money, summary } = model

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 text-[28px] leading-9">{t("report.yearTitle", { year: model.year })}</h1>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" size="icon" aria-label={t("report.previousYear")} onClick={model.previousYear}><ChevronLeft className="rtl:-scale-x-100" /></Button>
          <span className="min-w-12 text-center font-semibold tabular-nums">{model.year}</span>
          <Button variant="outline" size="icon" aria-label={t("report.nextYear")} onClick={model.nextYear}><ChevronRight className="rtl:-scale-x-100" /></Button>
          <Button variant="outline" onClick={model.print}><Download /> {t("report.savePdf")}</Button>
          <Button variant="ghost" className="text-link" asChild><Link to="/report">{t("report.title")}</Link></Button>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <section className={cn(card, "border-transparent shadow-sheet")}>
              <h2 className={label}>{t("report.savedThisYear")}</h2>
              <span className={cn(figure, summary.saved < 0 ? "text-destructive" : summary.saved > 0 && "text-success")}>{summary.saved > 0 ? "+" : ""}{money(summary.saved)}</span>
              {summary.savingRate !== null && <span className={meta}>{t("report.savingRate", { rate: summary.savingRate })}</span>}
            </section>
            <section className={card}>
              <h2 className={label}>{t("income.received")}</h2>
              <span className={figure}>{money(summary.received)}</span>
              <span className={meta}>{t("report.trailing")}: {model.trailing === null ? t("report.noProjection") : `${model.trailing}%`}</span>
            </section>
            <section className={card}>
              <h2 className={label}>{t("plan.spent")}</h2>
              <span className={figure}>{money(summary.spent)}</span>
              <span className={meta}>{t("report.monthlyAverage", { amount: money(model.monthlyAverage) })}</span>
            </section>
            <section className={card}>
              <h2 className={label}>{t("report.netWorthChange")}</h2>
              {summary.netWorthStart !== null && summary.netWorthEnd !== null ? (
                <>
                  <span className={cn(figure, summary.netWorthEnd < summary.netWorthStart && "text-destructive")}>{money(summary.netWorthEnd - summary.netWorthStart)}</span>
                  <span className={meta}>{money(summary.netWorthStart)} → {money(summary.netWorthEnd)}</span>
                </>
              ) : <span className={cn(figure, "text-muted-foreground")}>{t("report.noSnapshots")}</span>}
            </section>
          </div>

          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={heading}>{t("report.spendingByBucket")}</h2>
              <span className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
                {model.buckets.map((bucket, i) => <span key={bucket.id} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", colourOf(i))} />{bucket.name}</span>)}
              </span>
            </div>
            <div className="grid h-60 grid-cols-12 items-end gap-1.5 border-b border-border pt-2.5 sm:gap-3.5">
              {model.columns.map((column) => (
                <div key={column.key} className="flex h-full flex-col-reverse gap-0.5">
                  {column.segments.map((segment, i) => segment.amount > 0 && (
                    <span key={segment.id} className={cn("rounded-[3px]", colourOf(i))} style={{ height: `${segment.percent}%` }} title={`${model.buckets[i].name} · ${column.label}: ${money(segment.amount)}`} />
                  ))}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-12 gap-1.5 text-center text-xs text-muted-foreground sm:gap-3.5">
              {model.columns.map((column) => <span key={column.key} className="truncate">{column.label}</span>)}
            </div>
            <span className={meta}>{t("report.savingRateDefinition")}</span>
          </section>

          <section className={card}>
            <h2 className={heading}>{t("report.months")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold [&>th]:whitespace-nowrap">
                    <th className="text-start">{t("report.month")}</th><th className="text-end">{t("income.received")}</th><th className="text-end">{t("plan.spent")}</th><th className="text-end">{t("report.saved")}</th><th className="text-end">{t("report.rate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {model.months.map((m) => (
                    <tr key={m.key} className={cn("border-t border-border [&>td]:px-3 [&>td]:py-2.5 [&>td]:whitespace-nowrap", m.current && "font-semibold")}>
                      <td>{m.label}</td>
                      <td className="text-end tabular-nums">{money(m.received)}</td>
                      <td className="text-end tabular-nums">{money(m.spent)}</td>
                      <td className={cn("text-end tabular-nums", m.saved < 0 ? "text-destructive" : m.saved > 0 && "text-success")}>{m.saved > 0 ? "+" : ""}{money(m.saved)}</td>
                      <td className="text-end tabular-nums">{m.savingRate === null ? "—" : `${m.savingRate}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={card}>
            <h2 className={heading}>{t("report.topCategories")}</h2>
            {model.categories.length === 0 && <p className="text-muted-foreground">{t("transactions.none")}</p>}
            {model.categories.length > 0 && (
              <table className="w-full text-sm">
                <tbody>
                  {model.categories.map((category) => (
                    <tr key={category.name} className="border-t border-border first:border-t-0 [&>td]:px-3 [&>td]:py-2.5">
                      <td>{category.name}</td>
                      <td className="w-2/5"><span className="flex h-1.5 overflow-hidden rounded-full bg-muted"><span className="rounded-full bg-primary" style={{ width: `${category.percent}%` }} /></span></td>
                      <td className="text-end tabular-nums">{money(category.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}
