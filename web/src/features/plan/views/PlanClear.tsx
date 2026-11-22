import { CircleAlert, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { PlanPageModel } from "../usePlanPage"
import { ColourInput, FixedInput, Moves, NameInput, PlanMonth, ShareInput, UsedBar } from "./parts"
import { toggleFixed } from "./shared"

const micro = "text-xs font-semibold uppercase text-muted-foreground"
const pill = "rounded-full"

/** Clear: a dark banner with what is free this month, one card per bucket, then the allocation as a table. */
export default function PlanClear({ model }: { model: PlanPageModel }) {
  const { t } = useTranslation()
  const { view, money, rows } = model
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">{t("plan.title")}</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <PlanMonth model={model} />
          {model.canMove && <Button data-tour="plan-move" className={`${pill} h-11 bg-accent px-5 text-[17px] font-normal text-link hover:bg-accent/80`} onClick={() => model.setMoving(true)}>{t("plan.move")}</Button>}
        </div>
      </div>

      <section data-tour="plan-figures" className="flex flex-wrap items-center gap-10 rounded-[22px] bg-hero p-7 text-hero-foreground">
        <div className="flex-[1_1_260px]">
          <div className="text-xs font-semibold uppercase text-hero-muted">{t("plan.freeToSpend")}</div>
          <div className="mt-1.5 text-5xl leading-tight font-semibold tracking-tight tabular-nums">{money(model.freeTotal)}</div>
          <div className="mt-1 text-[13px] text-hero-muted tabular-nums">{t("plan.ofPlanned", { amount: money(view.income.planned), percent: model.usedPercent })}</div>
        </div>
        {rows.length > 0 && (
          <div className="flex flex-[2_1_420px] flex-col gap-2">
            <div className="flex h-4 gap-0.5 overflow-hidden rounded bg-white/15">
              {rows.map((row) => <span key={row.id} className="rounded-[3px]" style={{ width: `${model.widthOf(row.figure.allocated)}%`, background: row.colour }} />)}
            </div>
            <div className="flex flex-wrap gap-x-[18px] gap-y-1 text-[13px] text-hero-muted">
              {rows.map((row) => <span key={row.id} className="inline-flex items-center gap-1.5"><span className="size-[9px] rounded-full" style={{ background: row.colour }} />{row.name} {row.sharePercent}%</span>)}
            </div>
          </div>
        )}
      </section>

      {rows.length === 0 && <p className="text-muted-foreground">{t("plan.noBuckets")}</p>}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-5">
        {rows.map((row) => (
          <section key={row.id} className="flex flex-col gap-3 rounded-[18px] bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2.5"><span className="size-3 shrink-0 rounded-full" style={{ background: row.colour }} /><span className="truncate text-[17px] font-semibold">{row.name}</span></span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">{row.sharePercent}%</span>
            </div>
            <div>
              <div className={micro}>{t("plan.free")}</div>
              <div className={`mt-1 text-[22px] font-semibold tracking-tight tabular-nums ${row.state === "over" ? "text-destructive" : row.state === "full" ? "text-muted-foreground" : "text-success"}`}>{money(row.figure.free)}</div>
            </div>
            <UsedBar colour={row.colour} spent={row.spentPercent} committed={row.committedPercent} className="rounded" />
            <dl className="flex flex-col gap-1">
              {([["allocated", row.figure.allocated], ["committed", row.figure.committed], ["spent", row.figure.spent]] as const).map(([key, amount]) => (
                <div key={key} className="flex items-baseline justify-between gap-2"><dt className={micro}>{t(`plan.${key}`)}</dt><dd className="text-sm font-semibold tabular-nums">{money(amount)}</dd></div>
              ))}
            </dl>
            {row.figure.carriedIn > 0 && <span className="text-[13px] text-muted-foreground tabular-nums">{t("plan.carriedIn", { amount: money(row.figure.carriedIn) })}</span>}
            {row.state === "over" && (
              <div className="flex items-center gap-2.5 rounded-[14px] bg-destructive-soft px-3 py-2 text-[13px]">
                <CircleAlert className="size-5 shrink-0 text-destructive" />{t("plan.overspentBy", { amount: money(-row.figure.free) })}
              </div>
            )}
          </section>
        ))}
      </div>
      {view.figures.unallocatedPlanned !== 0 && <p className="text-sm">{t("plan.unallocated", { amount: money(view.figures.unallocatedPlanned) })}</p>}
      {model.fixedExcess > 0 && <div className="rounded-[14px] bg-warning-soft px-3.5 py-3 text-sm">{t("plan.fixedExceeds", { amount: money(model.fixedExcess) })}</div>}
      {view.moves.length > 0 && <section className="rounded-[18px] bg-card p-5"><Moves model={model} /></section>}

      <section data-tour="plan-editor" className="overflow-hidden rounded-[18px] bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{t("plan.buckets")}</h2>
            <p className="text-[13px] text-muted-foreground">{view.plan ? t("plan.versionNote", { from: view.plan.effectiveFrom }) : t("plan.noPlan")}</p>
          </div>
          <span className="flex items-center gap-3">
            {!model.dirty && <span className="text-[13px] text-muted-foreground">{t("plan.noChanges")}</span>}
            <Button data-tour="plan-save" onClick={() => void model.save()} disabled={!model.dirty} className={`${pill} h-11 px-5 text-[17px] font-normal disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100`}>{t("plan.save")}</Button>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground [&>th]:px-4 [&>th]:py-2.5 [&>th]:text-start [&>th]:font-semibold">
                <th>{t("plan.colour")}</th><th>{t("plan.name")}</th><th>{t("plan.share")}</th><th>{t("plan.fixedAmount")}</th><th>{t("plan.carryOver")}</th><th />
              </tr>
            </thead>
            <tbody>
              {model.editing.map((bucket, index) => (
                <tr key={bucket.id ?? index} className="border-b border-border last:border-b-0 [&>td]:px-4 [&>td]:py-3">
                  <td><ColourInput model={model} index={index} bucket={bucket} className="size-7 rounded-lg border-0 p-0" /></td>
                  <td><NameInput model={model} index={index} bucket={bucket} className="min-w-40 rounded-xl" /></td>
                  <td><ShareInput model={model} index={index} bucket={bucket} className="w-24 [&_input]:rounded-xl" /></td>
                  <td><span className="flex items-center gap-2"><Switch aria-label={t("plan.fixedAmount")} checked={bucket.fixedAmount !== null} onCheckedChange={toggleFixed(model, index, bucket)} /><FixedInput model={model} index={index} bucket={bucket} className="rounded-xl" /></span></td>
                  <td>
                    <span className="flex items-center gap-2">
                      <Switch aria-label={t("plan.carryOver")} checked={bucket.carryOver} onCheckedChange={(on) => model.update(index, { carryOver: on })} />
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${bucket.carryOver ? "bg-info-soft text-link" : "bg-muted text-muted-foreground"}`}>{bucket.carryOver ? t("plan.carries") : t("plan.resets")}</span>
                    </span>
                  </td>
                  <td className="text-end"><Button variant="ghost" size="icon" className="rounded-full text-destructive" aria-label={t("plan.remove")} onClick={() => model.remove(index)}><Trash2 /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <Button variant="ghost" className={`${pill} text-link`} onClick={model.add}><Plus /> {t("plan.addBucket")}</Button>
          {model.gapShares !== 0 && <Button variant="ghost" className={`${pill} text-link`} onClick={model.rebalance}>{t("plan.rebalance")}</Button>}
          <span data-tour="plan-balance" className={`ms-auto rounded-full px-2.5 py-1 text-xs font-semibold ${model.gapShares === 0 ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{model.balance}</span>
        </div>
      </section>
    </div>
  )
}
