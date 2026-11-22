import { ArrowDownLeft, CircleCheck, HandCoins, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lead, PageTop, Pill, amountLarge, card, cardTitle, eyebrow, heroCard, meta, row } from "@/features/networth/views/parts"
import type { DebtsPageModel } from "../useDebtsPage"

type Side = DebtsPageModel["owing"]

/** Soft: what is owed and what is owed back as two cards side by side, then the two payoff orders as tiles with the better one marked. */
export default function DebtsSoft({ model }: { model: DebtsPageModel }) {
  const { t } = useTranslation()

  function sideCard(side: Side, owing: boolean) {
    const colour = owing ? "text-destructive" : "text-success"
    return (
      <section className={owing ? heroCard : card}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={eyebrow}>{t(owing ? "debts.owing" : "debts.owed")}</h2>
        </div>
        <span className={`${amountLarge} ${side.rows.length > 0 ? colour : ""}`}>{side.rows.length > 0 ? (owing ? "−" : "+") : ""}{side.total}</span>
        <p className={meta}>{t(owing ? "debts.owingBody" : "debts.owedBody")}</p>
        {side.rows.length === 0 && <p className="text-muted-foreground">{t("debts.none")}</p>}
        <div>
          {side.rows.map((line) => (
            <button key={line.debt.id} type="button" className={`${row} w-full text-start`} onClick={() => model.setDetail(line.debt)}>
              <Lead icon={owing ? HandCoins : ArrowDownLeft} className={`size-8 rounded-lg ${owing ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success"}`} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{line.title}</span>
                <span className="truncate text-xs text-muted-foreground">{line.line}</span>
              </span>
              {line.interestFree && <Pill>{t("debts.interestFree")}</Pill>}
              <span className={`shrink-0 font-medium tabular-nums ${line.debt.status === "SETTLED" ? "text-muted-foreground" : colour}`}>{line.balance}</span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageTop title={t("debts.title")}>
        <Button onClick={() => model.setEditing("new")}><Plus /> {t("debts.add")}</Button>
      </PageTop>

      <div className="grid gap-4 lg:grid-cols-2">
        {sideCard(model.owing, true)}
        {sideCard(model.owed, false)}
      </div>

      {model.strategies && (
        <section className={card}>
          <div>
            <h2 className={cardTitle}>{t("debts.strategyTitle")}</h2>
            <p className={meta}>{t("debts.strategyBody")}</p>
          </div>
          <div className="max-w-[280px]">
            <Field id="strategyExtra" label={t("debts.extraPerMonth")}>
              <Input id="strategyExtra" inputMode="decimal" dir="ltr" value={model.extra} onChange={(e) => model.setExtra(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {model.strategies.map((strategy) => (
              <div key={strategy.name} className={`flex flex-col gap-1.5 rounded-[10px] p-4 ${strategy.best ? "bg-accent text-accent-foreground ring-2 ring-primary ring-inset" : "bg-muted"}`}>
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{t(`debts.strategies.${strategy.name}`)}</span>
                  {strategy.best && <Pill tone="ok" icon={CircleCheck}>{t(`debts.${strategy.best}`)}</Pill>}
                </span>
                <span className="text-[13px] opacity-80">{t(`debts.strategyHints.${strategy.name}`)}</span>
                <span className="text-[15px] font-semibold tabular-nums">{strategy.outcome}</span>
                <span className="text-[13px] opacity-80">{strategy.order}</span>
              </div>
            ))}
          </div>
          {model.difference && <p className={meta}>{model.difference}</p>}
        </section>
      )}
    </div>
  )
}
