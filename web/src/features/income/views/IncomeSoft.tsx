import { ArrowDownLeft, Banknote, CircleCheck, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HelpButton } from "@/components/HelpButton"
import { MonthPicker } from "@/components/MonthPicker"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { IncomePageModel } from "../useIncomePage"

const card = "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
const heading = "font-sans text-base font-semibold"
const badge = "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold [&>svg]:size-3.5"
const row = "flex flex-wrap items-center gap-3 border-t border-border py-3 first:border-t-0"
const lead = "grid size-8 shrink-0 place-items-center rounded-lg [&>svg]:size-5"

/** Soft: what has arrived against the plan, the month's expected income beside it, then the sources as a table. */
export default function IncomeSoft({ model }: { model: IncomePageModel }) {
  const { t } = useTranslation()
  const { money, date, today } = model

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 text-[28px] leading-9">{t("income.title")}</h1>
        <MonthPicker value={model.monthKey} onChange={model.setMonthKey} /><HelpButton tour="income" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12" data-tour="income-month">
        <section className={cn(card, "border-transparent shadow-sheet lg:col-span-5")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-sans text-[13px] font-semibold text-muted-foreground">{t("income.receivedThisMonth")}</h2>
            {model.allIn && <span className={cn(badge, "bg-success-soft text-success")}><CircleCheck />{t("income.allIn")}</span>}
          </div>
          <span className={cn("text-[34px] leading-10 font-bold tracking-tight tabular-nums", model.received > 0 && "text-success")}>{model.received > 0 ? "+" : ""}{money(model.received)}</span>
          <span className="flex h-2 overflow-hidden rounded-full bg-muted"><span className="rounded-full bg-success" style={{ width: `${model.receivedPercent}%` }} /></span>
          <span className="text-[13px] text-muted-foreground tabular-nums">{t("income.ofPlanned", { amount: money(model.planned) })}</span>
        </section>

        <section className={cn(card, "lg:col-span-7")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={heading}>{t("income.expectedThisMonth")}</h2>
            <Button variant="ghost" className="text-link" onClick={model.addIrregular}><Plus /> {t("income.addIrregular")}</Button>
          </div>
          {model.occurrences.length === 0 && model.irregular.length === 0 && <p className="text-muted-foreground">{t("income.nothingPlanned")}</p>}
          <div>
            {model.occurrences.map((occurrence) => {
              const got = occurrence.receipt
              const late = !got && occurrence.date < today
              return (
                <div key={`${occurrence.source.id}-${occurrence.date}`} className={row}>
                  <span className={cn(lead, got ? "bg-success text-primary-foreground" : "bg-accent text-accent-foreground")}>{got ? <ArrowDownLeft /> : <Banknote />}</span>
                  <span className="flex min-w-0 flex-[1_1_140px] flex-col">
                    <span className="truncate text-sm font-medium">{occurrence.source.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{got ? t("income.receivedOn", { date: date(got.receivedOn) }) : t("income.expectedOn", { date: date(occurrence.date) })}</span>
                  </span>
                  {got
                    ? <button type="button" onClick={() => model.editReceipt(got)} className={cn(badge, "bg-success-soft text-success")}><CircleCheck />{t("income.received")}</button>
                    : <span className={cn(badge, late ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground")}>{late ? t("income.overdue") : t("income.expected")}</span>}
                  <span className={cn("font-medium tabular-nums", got ? "text-success" : "text-muted-foreground")}>{got ? "+" : ""}{money(got?.baseAmount ?? occurrence.amount)}</span>
                  {!got && <Button size="sm" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80" onClick={() => model.markReceived(occurrence.source, occurrence.date)}>{t("income.markReceived")}</Button>}
                </div>
              )
            })}
            {model.irregular.map((r) => (
              <button key={r.id} type="button" onClick={() => model.editReceipt(r)} className={cn(row, "w-full text-start hover:bg-muted/50")}>
                <span className={cn(lead, "bg-success text-primary-foreground")}><ArrowDownLeft /></span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{r.note || t("income.irregular")}</span>
                  <span className="truncate text-xs text-muted-foreground">{t("income.receivedOn", { date: date(r.receivedOn) })}</span>
                </span>
                <span className="font-medium text-success tabular-nums">+{money(r.baseAmount)}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className={heading}>{t("income.sources")}</h2>
            <p className="text-[13px] text-muted-foreground">{t("income.sourcesHint")}</p>
          </div>
          <Button variant="ghost" className="text-link" data-tour="income-add-source" onClick={model.addSource}><Plus /> {t("income.addSource")}</Button>
        </div>
        {model.sources.length === 0 && <p className="text-muted-foreground" data-tour="income-sources">{t("income.noSources")}</p>}
        {model.sources.length > 0 && (
          <div className="overflow-x-auto" data-tour="income-sources">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold">
                  <th className="text-start">{t("income.source")}</th>
                  <th className="text-start">{t("income.frequency")}</th>
                  <th className="text-start">{t("income.goesTo")}</th>
                  <th className="text-end">{t("income.amount")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {model.sources.map(({ source, ended, amount, goesTo, canEnd }) => (
                  <tr key={source.id} className={cn("border-t border-border [&>td]:px-3 [&>td]:py-2.5", ended && "text-muted-foreground")}>
                    <td className="font-semibold">{source.name}</td>
                    <td>
                      {t(`income.frequencies.${source.frequency}`)}
                      {source.frequency === "MONTHLY" ? ` · ${t("income.payDayShort", { day: source.payDay })}` : ""}
                      {source.activeTo && !ended ? ` · ${t("income.endsOn", { date: date(source.activeTo) })}` : ""}
                    </td>
                    <td>{goesTo || "—"}</td>
                    <td className="text-end tabular-nums">{money(amount, source.currency)}</td>
                    <td className="text-end whitespace-nowrap">
                      {ended && <span className={cn(badge, "me-1 bg-muted text-muted-foreground")}>{t("income.ended")}</span>}
                      <Button size="sm" variant="ghost" className="text-link" onClick={() => model.editSource(source)}>{t("income.edit")}</Button>
                      {canEnd && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => model.endSource(source)}>{t("income.end")}</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
