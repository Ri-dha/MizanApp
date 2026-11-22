import { ArrowDown, ArrowUp, ChevronRight, Download } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { MonthPicker } from "@/components/MonthPicker"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReportPageModel } from "../useReportPage"

const card = "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
const heading = "font-sans text-base font-semibold"
const label = "font-sans text-[13px] font-semibold text-muted-foreground"
const figure = "text-[26px] leading-8 font-semibold tabular-nums"

/** Soft: four figures across the top, then planned against actual beside the biggest categories. */
export default function ReportSoft({ model }: { model: ReportPageModel }) {
  const { t } = useTranslation()
  const { money } = model

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 text-[28px] leading-9">{t("report.title")}</h1>
        <MonthPicker value={model.monthKey} onChange={model.setMonthKey} />
        <Button variant="outline" className="print:hidden" onClick={model.print}><Download /> {t("report.savePdf")}</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <section className={cn(card, "border-transparent shadow-sheet")}>
          <h2 className={label}>{t("report.savingRateTitle")}</h2>
          <span className={cn(figure, model.savingRate !== null && model.savingRate < 0 && "text-destructive")}>{model.savingRate === null ? t("report.noProjection") : `${model.savingRate}%`}</span>
        </section>
        <section className={card}>
          <h2 className={label}>{t("income.received")}</h2>
          <span className={cn(figure, model.received > 0 && "text-success")}>{model.received > 0 ? "+" : ""}{money(model.received)}</span>
        </section>
        <section className={card}>
          <h2 className={label}>{t("plan.spent")}</h2>
          <span className={figure}>{model.spent > 0 ? "−" : ""}{money(model.spent)}</span>
          {model.spentShare !== null && <span className="text-[13px] text-muted-foreground tabular-nums">{t("report.shareOfIncome", { percent: model.spentShare })}</span>}
        </section>
        <section className={card}>
          <h2 className={label}>{t("report.vsLastMonth")}</h2>
          <span className={cn(figure, "flex items-center gap-1.5 [&>svg]:size-5", model.delta > 0 ? "text-destructive" : model.delta < 0 && "text-success")}>
            {model.delta > 0 ? <ArrowUp /> : model.delta < 0 ? <ArrowDown /> : null}{model.signed(model.delta)}
          </span>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {!model.simple && (
          <section className={cn(card, "lg:col-span-7")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={heading}>{t("report.plannedVsActual")}</h2>
            </div>
            {model.buckets.length === 0 && <p className="text-muted-foreground">{t("plan.noBuckets")}</p>}
            {model.buckets.map((bucket) => (
              <div key={bucket.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
                <span className="flex min-w-0 items-center gap-2 truncate font-medium"><span className="size-2.5 shrink-0 rounded-full" style={{ background: bucket.colour }} />{bucket.name}</span>
                <span className="order-last col-span-2 flex h-3 overflow-hidden rounded-md bg-muted sm:order-none sm:col-span-1">
                  <span className={cn("rounded-md", bucket.over && "bg-destructive")} style={{ width: `${bucket.percent}%`, background: bucket.over ? undefined : bucket.colour }} />
                </span>
                <span className="text-end tabular-nums"><b className={cn("font-semibold", bucket.over && "text-destructive")}>{money(bucket.actual)}</b> <span className="text-[13px] text-muted-foreground">{t("report.ofAmount", { amount: money(bucket.allocated) })}</span></span>
              </div>
            ))}
          </section>
        )}

        <section className={cn(card, model.simple ? "lg:col-span-12" : "lg:col-span-5")}>
          <h2 className={heading}>{t("report.topCategories")}</h2>
          {model.categories.length === 0 && <p className="text-muted-foreground">{t("transactions.none")}</p>}
          {model.categories.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold">
                  <th className="text-start">{t("report.category")}</th><th className="w-2/5" /><th className="text-end">{t("plan.spent")}</th>
                </tr>
              </thead>
              <tbody>
                {model.categories.map((category) => (
                  <tr key={category.name} className="border-t border-border [&>td]:px-3 [&>td]:py-2.5">
                    <td>{category.name}</td>
                    <td><span className="flex h-1.5 overflow-hidden rounded-full bg-muted"><span className="rounded-full bg-primary" style={{ width: `${category.percent}%` }} /></span></td>
                    <td className="text-end tabular-nums">{money(category.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!model.simple && <Button asChild variant="ghost" className="self-start text-link print:hidden"><Link to="/report/year">{t("report.yearHeading")}<ChevronRight className="rtl:-scale-x-100" /></Link></Button>}
        </section>
      </div>
    </div>
  )
}
