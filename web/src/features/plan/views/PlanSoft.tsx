import { ArrowLeftRight, CircleCheck, Plus, Trash2, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { PlanPageModel } from "../usePlanPage"
import { ColourInput, FixedInput, Moves, NameInput, PlanMonth, ShareInput, UsedBar } from "./parts"
import { disabledSave, toggleFixed } from "./shared"

const card = "flex flex-col gap-4 rounded-xl bg-card p-5 shadow-card"

/** Soft: one headline card with the month's buckets as a table, then the allocation as rows. */
export default function PlanSoft({ model }: { model: PlanPageModel }) {
  const { t } = useTranslation()
  const { view, money, rows } = model
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">{t("plan.title")}</h1>
        <PlanMonth model={model} />
      </div>

      <section className={card} data-tour="plan-figures">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl">{t("plan.figures")}</h2>
            <p className="text-sm text-muted-foreground tabular-nums">{t("plan.monthLine", { planned: money(view.income.planned), received: money(view.income.received) })}</p>
          </div>
          {model.canMove && <Button variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80" data-tour="plan-move" onClick={() => model.setMoving(true)}><ArrowLeftRight /> {t("plan.move")}</Button>}
        </div>
        {rows.length === 0 && <p className="text-muted-foreground">{t("plan.noBuckets")}</p>}
        {rows.length > 0 && (
          <>
            <div className="flex h-2.5 gap-[3px]">
              {rows.map((row) => <span key={row.id} className="rounded-full" style={{ width: `${model.widthOf(row.figure.allocated)}%`, background: row.colour }} />)}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground [&>th]:px-3 [&>th]:py-2 [&>th]:font-semibold">
                    <th className="text-start">{t("plan.name")}</th>
                    <th className="text-end">{t("plan.allocated")}</th>
                    <th className="text-end">{t("plan.committed")}</th>
                    <th className="text-end">{t("plan.spent")}</th>
                    <th className="w-1/4 text-start">{t("plan.used")}</th>
                    <th className="text-end">{t("plan.free")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-border [&>td]:px-3 [&>td]:py-3">
                      <td>
                        <span className="flex items-center gap-2 font-semibold">
                          <span className="size-3 shrink-0 rounded-full" style={{ background: row.colour }} />{row.name}
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">{row.sharePercent}%</span>
                        </span>
                        {row.figure.carriedIn > 0 && <span className="ps-5 text-xs text-muted-foreground tabular-nums">{t("plan.carriedIn", { amount: money(row.figure.carriedIn) })}</span>}
                      </td>
                      <td className="text-end tabular-nums">{money(row.figure.allocated)}</td>
                      <td className="text-end tabular-nums">{money(row.figure.committed)}</td>
                      <td className="text-end tabular-nums">{money(row.figure.spent)}</td>
                      <td><UsedBar colour={row.colour} spent={row.spentPercent} committed={row.committedPercent} /></td>
                      <td className={`text-end text-[15px] font-semibold tabular-nums ${row.state === "over" ? "text-destructive" : row.state === "full" ? "text-muted-foreground" : ""}`}>{money(row.figure.free)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {view.figures.unallocatedPlanned !== 0 && <p className="text-sm">{t("plan.unallocated", { amount: money(view.figures.unallocatedPlanned) })}</p>}
        {model.fixedExcess > 0 && (
          <p className="flex items-center gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm"><TriangleAlert className="size-4 shrink-0 text-warning" />{t("plan.fixedExceeds", { amount: money(model.fixedExcess) })}</p>
        )}
        <Moves model={model} className="border-t border-border pt-3" />
      </section>

      <section className={card} data-tour="plan-editor">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl">{t("plan.buckets")}</h2>
            <p className="text-sm text-muted-foreground">{view.plan ? t("plan.versionNote", { from: view.plan.effectiveFrom }) : t("plan.noPlan")}</p>
          </div>
          <Button variant="ghost" className="text-link" onClick={model.add}><Plus /> {t("plan.addBucket")}</Button>
        </div>
        <div>
          {model.editing.map((bucket, index) => (
            <div key={bucket.id ?? index} className="flex flex-wrap items-center gap-3 border-t border-border py-2.5">
              <ColourInput model={model} index={index} bucket={bucket} className="size-8 border-0 p-0" />
              <NameInput model={model} index={index} bucket={bucket} className="min-w-0 flex-[1_1_200px]" />
              <ShareInput model={model} index={index} bucket={bucket} className="w-24" />
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch id={`fixed-${index}`} checked={bucket.fixedAmount !== null} onCheckedChange={toggleFixed(model, index, bucket)} />
                <Label htmlFor={`fixed-${index}`}>{t("plan.fixedAmount")}</Label>
                <FixedInput model={model} index={index} bucket={bucket} />
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch id={`carry-${index}`} checked={bucket.carryOver} onCheckedChange={(on) => model.update(index, { carryOver: on })} />
                <Label htmlFor={`carry-${index}`}>{t("plan.carryOver")}</Label>
              </span>
              <Button variant="ghost" size="icon" className="text-destructive" aria-label={t("plan.remove")} onClick={() => model.remove(index)}><Trash2 /></Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3.5">
          <span data-tour="plan-balance" className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${model.gapShares === 0 ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
            {model.gapShares === 0 ? <CircleCheck className="size-3.5" /> : <TriangleAlert className="size-3.5" />}{model.balance}
          </span>
          {model.gapShares !== 0 && <Button variant="outline" size="sm" onClick={model.rebalance}>{t("plan.rebalance")}</Button>}
          <span className="text-sm text-muted-foreground">{t("plan.presets")}</span>
          <span className="flex gap-1.5" aria-hidden>{model.presets.map((colour) => <span key={colour} className="size-[18px] rounded-full" style={{ background: colour }} />)}</span>
          <span className="flex-1" />
          {!model.dirty && <span className="text-sm text-muted-foreground">{t("plan.noChanges")}</span>}
          <Button size="lg" data-tour="plan-save" onClick={() => void model.save()} disabled={!model.dirty} className={disabledSave}>{t("plan.save")}</Button>
        </div>
      </section>
    </div>
  )
}
