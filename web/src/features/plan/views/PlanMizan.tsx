import { ArrowLeftRight, Check, Trash2, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { PlanPageModel } from "../usePlanPage"
import { ColourInput, FixedInput, Moves, NameInput, PlanMonth, ShareInput, UsedBar } from "./parts"
import { disabledSave, toggleFixed } from "./shared"

const card = "rounded-[14px] border border-border bg-card shadow-card"
const caps = "text-xs font-medium tracking-wider text-muted-foreground uppercase"
const outline = "border-input bg-card"

/** Mizan: buckets as rows inside one card, each with its four figures and a bar; the allocation below. */
export default function PlanMizan({ model }: { model: PlanPageModel }) {
  const { t } = useTranslation()
  const { view, money, rows } = model
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] leading-9 font-semibold">{t("plan.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">{t("plan.monthLine", { planned: money(view.income.planned), received: money(view.income.received) })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlanMonth model={model} />
          {model.canMove && <Button variant="secondary" data-tour="plan-move" onClick={() => model.setMoving(true)}><ArrowLeftRight /> {t("plan.move")}</Button>}
        </div>
      </header>

      <section className={`${card} overflow-hidden`} data-tour="plan-figures">
        <div className="px-6 pt-5 pb-2"><h2 className="font-display text-lg leading-[26px] font-semibold">{t("plan.figures")}</h2></div>
        {rows.length === 0 && <p className="px-6 pb-5 text-muted-foreground">{t("plan.noBuckets")}</p>}
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-3 border-t border-border px-6 py-[18px]">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="size-3 rounded-full" style={{ background: row.colour }} />
              <span className="text-base font-semibold">{row.name}</span>
              <span className="text-[13px] text-muted-foreground tabular-nums">{t("plan.shareOfIncome", { percent: row.sharePercent })}</span>
              {row.state === "over" && <span className="rounded-md bg-destructive-soft px-2 py-0.5 text-xs font-medium text-destructive">{t("plan.overPlan")}</span>}
              {row.state === "full" && <span className="rounded-md bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">{t("plan.fullyCommitted")}</span>}
              {row.state === "ok" && row.figure.spent > 0 && <span className="rounded-md bg-success-soft px-2 py-0.5 text-xs font-medium text-success">{t("plan.onTrack")}</span>}
            </div>
            <div className="grid grid-cols-2 gap-3 tabular-nums sm:grid-cols-4">
              <div><div className={caps}>{t("plan.allocated")}</div><div className="font-semibold">{money(row.figure.allocated)}</div>
                {row.figure.carriedIn > 0 && <div className="text-xs text-muted-foreground">{t("plan.carriedIn", { amount: money(row.figure.carriedIn) })}</div>}</div>
              <div><div className={caps}>{t("plan.committed")}</div><div className="font-semibold">{money(row.figure.committed)}</div></div>
              <div><div className={caps}>{t("plan.spent")}</div><div className="font-semibold">{money(row.figure.spent)}</div></div>
              <div><div className={caps}>{t("plan.free")}</div><div className={`font-display text-lg font-semibold ${row.state === "over" ? "text-destructive" : row.state === "full" ? "text-muted-foreground" : ""}`}>{money(row.figure.free)}</div></div>
            </div>
            <UsedBar colour={row.colour} spent={row.spentPercent} committed={row.committedPercent} />
          </div>
        ))}
        {(view.figures.unallocatedPlanned !== 0 || model.fixedExcess > 0 || view.moves.length > 0) && (
          <div className="flex flex-col gap-3 border-t border-border px-6 py-4">
            {view.figures.unallocatedPlanned !== 0 && <p className="text-sm">{t("plan.unallocated", { amount: money(view.figures.unallocatedPlanned) })}</p>}
            {model.fixedExcess > 0 && <p className="flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm"><TriangleAlert className="size-4 shrink-0 text-warning" />{t("plan.fixedExceeds", { amount: money(model.fixedExcess) })}</p>}
            <Moves model={model} />
          </div>
        )}
      </section>

      <section className={`${card} flex flex-col gap-4 p-6`} data-tour="plan-editor">
        <div>
          <h2 className="font-display text-lg leading-[26px] font-semibold">{t("plan.buckets")}</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{view.plan ? t("plan.versionNote", { from: view.plan.effectiveFrom }) : t("plan.noPlan")}</p>
        </div>
        <div>
          {model.editing.map((bucket, index) => (
            <div key={bucket.id ?? index} className="flex flex-wrap items-center gap-3 border-t border-border py-3">
              <ColourInput model={model} index={index} bucket={bucket} />
              <NameInput model={model} index={index} bucket={bucket} className={`min-w-0 flex-[1_1_200px] ${outline}`} />
              <ShareInput model={model} index={index} bucket={bucket} className={`w-24 [&_input]:border-input [&_input]:bg-card`} />
              <span className="flex items-center gap-2 text-sm">
                <Switch id={`fixed-${index}`} checked={bucket.fixedAmount !== null} onCheckedChange={toggleFixed(model, index, bucket)} />
                <Label htmlFor={`fixed-${index}`}>{t("plan.fixedAmount")}</Label>
                <FixedInput model={model} index={index} bucket={bucket} className={outline} />
              </span>
              <span className="flex items-center gap-2 text-sm">
                <Switch id={`carry-${index}`} checked={bucket.carryOver} onCheckedChange={(on) => model.update(index, { carryOver: on })} />
                <Label htmlFor={`carry-${index}`}>{t("plan.carryOver")}</Label>
              </span>
              <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label={t("plan.remove")} onClick={() => model.remove(index)}><Trash2 /></Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button variant="outline" className={outline} onClick={model.add}>{t("plan.addBucket")}</Button>
          {model.gapShares !== 0 && <Button variant="outline" className={outline} onClick={model.rebalance}>{t("plan.rebalance")}</Button>}
          <span data-tour="plan-balance" className={`flex items-center gap-1.5 text-[13px] font-medium tabular-nums ${model.gapShares === 0 ? "text-success" : "text-warning"}`}>
            {model.gapShares === 0 ? <Check className="size-3.5" strokeWidth={2.5} /> : <TriangleAlert className="size-3.5" />}{model.balance}
          </span>
          <Button data-tour="plan-save" onClick={() => void model.save()} disabled={!model.dirty} className={`ms-auto ${disabledSave}`}>{t("plan.save")}</Button>
        </div>
      </section>
    </div>
  )
}
