import { ArrowDownLeft, ArrowLeftRight, Paperclip, Receipt, RotateCcw, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HelpButton } from "@/components/HelpButton"
import { MonthPicker } from "@/components/MonthPicker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { LEDGER_TYPES, type LedgerDay, type TransactionsPageModel } from "../useTransactionsPage"

const ALL = "__all__"
const chip = "rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"

/** Soft: filters in one line, the month in three figures, then every day in a single card. */
export default function LedgerSoft({ model }: { model: TransactionsPageModel }) {
  const { t } = useTranslation()
  const { money, filter } = model

  const dayTotal = (day: LedgerDay) => (day.net !== 0 || day.moved === 0 ? (day.net > 0 ? "+" : day.net < 0 ? "−" : "") + money(Math.abs(day.net)) : t("transactions.movedDay", { amount: money(day.moved) }))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 text-[28px] leading-9">{t("transactions.title")}</h1>
        <MonthPicker value={model.monthKey} onChange={model.setMonthKey} /><HelpButton tour="ledger" />
      </div>

      <div className="flex flex-wrap items-center gap-2.5" data-tour="ledger-filters">
        <span className="relative flex-[1_1_260px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder={t("transactions.search")} value={filter.text} onChange={(e) => model.setText(e.target.value)} />
        </span>
        <span role="group" aria-label={t("transactions.allTypes")} className="inline-flex gap-0.5 rounded-lg bg-muted p-[3px]">
          {[null, ...LEDGER_TYPES].map((type) => (
            <button key={type ?? ALL} type="button" aria-pressed={filter.type === type} onClick={() => model.setType(type)}
              className={cn("rounded-md px-3 py-1 text-[13px] text-muted-foreground", filter.type === type && "bg-card font-semibold text-foreground shadow-card")}>
              {type ? t(`transactions.types.${type}`) : t("transactions.allTypes")}
            </button>
          ))}
        </span>
        <Select value={filter.bucketId ?? ALL} onValueChange={(v) => model.setBucket(v === ALL ? null : v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("transactions.allBuckets")}</SelectItem>
            {model.buckets.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input className="w-24" placeholder={t("transactions.min")} inputMode="numeric" dir="ltr" onChange={(e) => model.setMin(e.target.value)} />
        <Input className="w-24" placeholder={t("transactions.max")} inputMode="numeric" dir="ltr" onChange={(e) => model.setMax(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {([["moneyIn", model.totals.received, "+", "text-success"], ["moneyOut", model.totals.spent, "−", ""], ["moved", model.totals.moved, "", "text-muted-foreground"]] as const).map(([key, amount, sign, tone]) => (
          <div key={key} className="flex flex-col gap-0.5 rounded-xl border border-border bg-card px-[18px] py-3.5">
            <span className="text-[13px] text-muted-foreground">{t(`transactions.${key}`)}</span>
            <span className={cn("text-[22px] font-semibold tabular-nums", tone)}>{amount > 0 ? sign : ""}{money(amount)}</span>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card px-5 pt-1 pb-3 shadow-card" data-tour="ledger-list">
        {model.empty && <p className="py-4 text-muted-foreground">{t("transactions.none")}</p>}
        {model.days.map((day) => (
          <div key={day.date}>
            <div className="flex justify-between px-1 pt-3.5 pb-1.5 text-xs font-semibold text-muted-foreground"><span>{day.label}</span><span className="font-normal tabular-nums">{dayTotal(day)}</span></div>
            {day.rows.map(({ transaction: row, title, detail, bucketColour }) => (
              <button key={row.id} type="button" onClick={() => model.open(row)} className="flex w-full items-center gap-3 border-t border-border px-1 py-2.5 text-start first:border-t-0 hover:bg-muted/50">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground [&>svg]:size-5">
                  {row.type === "INCOME" ? <ArrowDownLeft /> : row.type === "TRANSFER" ? <ArrowLeftRight /> : <Receipt />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{title}</span>
                  {detail && <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">{bucketColour && <span className="size-2 shrink-0 rounded-full" style={{ background: bucketColour }} />}<span className="truncate">{detail}</span></span>}
                </span>
                {row.type !== "EXPENSE" && <span className={chip}>{t(`transactions.types.${row.type}`)}</span>}
                {row.attachmentId && <span className={chip} aria-label={t("transactions.receipt")}><Paperclip className="size-3.5" /></span>}
                {row.splitGroupId && <span className={chip}>{t("transactions.splitBadge")}</span>}
                <span className={cn("min-w-28 text-end font-medium tabular-nums", row.type === "INCOME" && "text-success", row.type === "TRANSFER" && "text-muted-foreground")}>{row.type === "INCOME" ? "+" : row.type === "EXPENSE" ? "−" : ""}{money(row.baseAmount)}</span>
              </button>
            ))}
          </div>
        ))}
      </section>

      {model.matchingCount > model.shownCount && (
        <Button variant="outline" className="self-center" onClick={model.more}>{t("transactions.loadMore", { shown: model.shownCount, total: model.matchingCount })}</Button>
      )}

      {model.deleted.length > 0 && (
        <section className="flex flex-col gap-1 rounded-xl border border-dashed border-border bg-card p-5">
          <h2 className="font-sans text-base font-semibold">{t("transactions.recentlyDeleted")}</h2>
          {model.deleted.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 border-t border-border py-2 first:border-t-0">
              <span className="truncate text-sm text-muted-foreground">{row.label}</span>
              <Button size="sm" variant="outline" onClick={() => model.restore(row.id)}><RotateCcw /> {t("accounts.restore")}</Button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
