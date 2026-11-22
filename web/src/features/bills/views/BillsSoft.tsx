import { CircleCheck, Plus, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HelpButton } from "@/components/HelpButton"
import { MonthPicker } from "@/components/MonthPicker"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { BillDue } from "@mizan/core/db/expenses"
import type { BillsPageModel } from "../useBillsPage"

const card = "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
const heading = "font-sans text-base font-semibold"
const badge = "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold [&>svg]:size-3.5"
const row = "flex flex-wrap items-center gap-3 border-t border-border py-3 first:border-t-0"

/** Soft: what is still due and what is paid as two figures, the month's bills as rows, then the standing lists. */
export default function BillsSoft({ model }: { model: BillsPageModel }) {
  const { t } = useTranslation()
  const { money, date } = model

  function status(bill: BillDue) {
    if (bill.occurrence) return <span className={cn(badge, "bg-success-soft text-success")}><CircleCheck />{t("bills.paidOn", { date: date(bill.occurrence.paidOn) })}</span>
    const days = model.daysUntil(bill.dueDate)
    if (days < 0) return <span className={cn(badge, "bg-warning-soft text-warning")}><TriangleAlert />{t("bills.overdue")}</span>
    return <span className={cn(badge, "bg-muted text-muted-foreground")}>{days === 0 ? t("bills.dueToday") : t("bills.inDays", { count: days })}</span>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 text-[28px] leading-9">{t("bills.title")}</h1>
        <MonthPicker value={model.monthKey} onChange={model.setMonthKey} /><HelpButton tour="bills" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-[18px] py-3.5">
          <span className="text-[13px] text-muted-foreground">{t("bills.stillDue")}</span>
          <span className="text-[22px] font-semibold tabular-nums">{money(model.stillDue)}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-[18px] py-3.5">
          <span className="text-[13px] text-muted-foreground">{t("bills.paid")}</span>
          <span className="text-[22px] font-semibold text-success tabular-nums">{money(model.paid)}</span>
        </div>
      </div>

      <section className={card} data-tour="bills-due">
        <h2 className={heading}>{t("bills.thisMonth")}</h2>
        {model.bills.length === 0 && <p className="text-muted-foreground">{t("bills.nothingDue")}</p>}
        <div>
          {model.bills.map((bill) => {
            const bucket = model.bucketOf(bill.expense.bucketId)
            return (
              <div key={`${bill.expense.id}-${bill.dueDate}`} className={row}>
                <span className="flex min-w-0 flex-[1_1_180px] flex-col gap-1">
                  <span className="truncate text-sm font-medium">{bill.expense.name}</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    {bucket && <span className="size-2 shrink-0 rounded-full" style={{ background: bucket.colour }} />}
                    <span className="truncate">{[bucket?.name, t("bills.dueOn", { date: date(bill.dueDate) })].filter(Boolean).join(" · ")}</span>
                  </span>
                </span>
                {status(bill)}
                <span className={cn("min-w-28 text-end font-medium tabular-nums", bill.occurrence && "text-muted-foreground")}>
                  {bill.expense.isEstimate && !bill.occurrence ? "≈ " : ""}{money(bill.occurrence?.actualAmount ?? bill.expectedAmount)}
                </span>
                {bill.occurrence
                  ? <Button size="sm" variant="ghost" className="text-link" onClick={() => model.undo(bill)}>{t("bills.undo")}</Button>
                  : <Button size="sm" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80" onClick={() => model.startPaying(bill)}>{t("bills.markPaid")}</Button>}
              </div>
            )
          })}
        </div>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={heading}>{t("bills.recurring")}</h2>
          <Button variant="ghost" className="text-link" data-tour="bills-add" onClick={model.add}><Plus /> {t("bills.add")}</Button>
        </div>
        {model.bills.length === 0 && <p className="text-muted-foreground">{t("bills.none")}</p>}
        <div>
          {model.recurring.map((expense) => (
            <button key={expense.id} type="button" onClick={() => model.edit(expense)} className={cn(row, "w-full text-start hover:bg-muted/50")}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{expense.name}</span>
                <span className="truncate text-xs text-muted-foreground">{[t(`bills.frequencies.${expense.frequency}`), model.bucketOf(expense.bucketId)?.name].filter(Boolean).join(" · ")}</span>
              </span>
              {expense.isEstimate && <span className={cn(badge, "bg-muted text-muted-foreground")}>{t("bills.estimate")}</span>}
              <span className="font-medium tabular-nums">{money(expense.amount, expense.currency)}</span>
            </button>
          ))}
        </div>
        {model.outsideMonth.length > 0 && (
          <>
            <p className="text-[13px] text-muted-foreground">{t("bills.notThisMonth")}</p>
            <div>
              {model.outsideMonth.map((expense) => (
                <button key={expense.id} type="button" onClick={() => model.edit(expense)} className={cn(row, "w-full text-start hover:bg-muted/50")}>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{expense.name}</span>
                  <span className="text-xs text-muted-foreground">{t(`bills.frequencies.${expense.frequency}`)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className={card} data-tour="bills-subscriptions">
        <div>
          <h2 className={heading}>{t("subscriptions.title")}</h2>
          <p className="text-[13px] text-muted-foreground">
            {model.subscriptions.lines.length === 0
              ? t("subscriptions.empty")
              : t("subscriptions.totals", { monthly: money(model.subscriptions.monthlyBase), yearly: money(model.subscriptions.yearlyBase) })}
            {model.subscriptions.lines.length > 0 && model.subscriptions.monthlyUsd !== null && (
              <span dir="ltr"> · {t("subscriptions.totalsUsd", { monthly: money(model.subscriptions.monthlyUsd, "USD"), yearly: money(model.subscriptions.yearlyUsd ?? 0, "USD") })}</span>
            )}
          </p>
        </div>
        {model.subscriptions.lines.length > 0 && (
          <div>
            {model.subscriptions.lines.map((line) => (
              <button key={line.expense.id} type="button" onClick={() => model.edit(line.expense)} className={cn(row, "w-full text-start hover:bg-muted/50")}>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{line.expense.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {money(line.expense.amount, line.expense.currency)} · {t(`bills.frequencies.${line.expense.frequency}`)}
                    {line.expense.currency !== model.base && ` · ${t("subscriptions.perMonthBase", { amount: money(line.monthlyBase) })}`}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end text-sm">
                  <span className="font-medium tabular-nums">{t("subscriptions.perMonth", { amount: money(line.monthlyBase) })}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{t("subscriptions.perYear", { amount: money(line.yearlyBase) })}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
