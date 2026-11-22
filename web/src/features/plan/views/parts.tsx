import { useTranslation } from "react-i18next"

import { fromMinorUnits, toMinorUnits } from "@/app/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HelpButton } from "@/components/HelpButton"
import { MonthPicker } from "@/components/MonthPicker"
import { cn } from "@/lib/utils"
import { percentToBasisPoints, basisPointsToPercent } from "@mizan/core/domain/plan/figures"
import type { BucketInput } from "@mizan/core/db/plan"
import type { PlanPageModel } from "../usePlanPage"

/** The controls every template's Plan needs; each view places and dresses them its own way. */

export function PlanMonth({ model }: { model: PlanPageModel }) {
  return <div className="flex items-center gap-2"><MonthPicker value={model.monthKey} onChange={model.setMonthKey} /><HelpButton tour="plan" /></div>
}

export function ColourInput({ model, index, bucket, className }: { model: PlanPageModel; index: number; bucket: BucketInput; className?: string }) {
  const { t } = useTranslation()
  return <input type="color" aria-label={t("plan.colour")} value={bucket.colour} onChange={(e) => model.update(index, { colour: e.target.value })}
    className={cn("size-9 shrink-0 cursor-pointer rounded-md border border-input bg-card p-1", className)} />
}

export function NameInput({ model, index, bucket, className }: { model: PlanPageModel; index: number; bucket: BucketInput; className?: string }) {
  const { t } = useTranslation()
  return <Input aria-label={t("plan.name")} value={bucket.name} onChange={(e) => model.update(index, { name: e.target.value })} maxLength={80} className={className} />
}

export function ShareInput({ model, index, bucket, className }: { model: PlanPageModel; index: number; bucket: BucketInput; className?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn("flex items-center gap-1", className)} dir="ltr">
      <Input aria-label={t("plan.share")} type="number" step="0.1" min="0" max="100" inputMode="decimal" className="text-end tabular-nums"
        disabled={bucket.fixedAmount !== null}
        value={bucket.fixedAmount !== null ? 0 : basisPointsToPercent(bucket.shareBasisPoints)}
        onChange={(e) => model.update(index, { shareBasisPoints: percentToBasisPoints(Number(e.target.value) || 0) })} />
      <span className="text-muted-foreground">%</span>
    </div>
  )
}

export function FixedInput({ model, index, bucket, className }: { model: PlanPageModel; index: number; bucket: BucketInput; className?: string }) {
  const { t } = useTranslation()
  if (bucket.fixedAmount === null) return null
  return <Input aria-label={t("plan.fixedAmount")} inputMode="decimal" dir="ltr" className={cn("w-32 tabular-nums", className)}
    value={fromMinorUnits(bucket.fixedAmount, model.currency)} onChange={(e) => model.update(index, { fixedAmount: toMinorUnits(e.target.value, model.currency) })} />
}

/** Money moved between buckets this month, each with its undo. */
export function Moves({ model, className }: { model: PlanPageModel; className?: string }) {
  const { t } = useTranslation()
  if (model.view.moves.length === 0) return null
  return (
    <div className={cn("flex flex-col gap-2 text-sm", className)}>
      {model.view.moves.map((move) => (
        <div key={move.id} className="flex items-center justify-between gap-2">
          <span>
            {model.date(move.movedOn)} · {model.bucketName(move.fromBucketId)} → {model.bucketName(move.toBucketId)}
            {move.reason ? <span className="text-muted-foreground"> · {move.reason}</span> : null}
          </span>
          <span className="flex items-center gap-2 tabular-nums">{model.money(move.amount)}
            <Button size="sm" variant="ghost" className="text-link" onClick={() => void model.undoMove(move)}>{t("bills.undo")}</Button>
          </span>
        </div>
      ))}
    </div>
  )
}

/** The bar of what is spent, with what is committed behind it in the same colour. */
export function UsedBar({ colour, spent, committed, className }: { colour: string; spent: number; committed: number; className?: string }) {
  return (
    <span className={cn("flex h-2 overflow-hidden rounded-full bg-muted", className)}>
      <span style={{ width: `${spent}%`, background: colour }} />
      <span style={{ width: `${committed}%`, background: colour, opacity: 0.4 }} />
    </span>
  )
}
