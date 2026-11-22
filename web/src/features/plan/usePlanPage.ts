import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useSession } from "@/api/auth"
import { formatWhen } from "@/app/dates"
import { formatMoney } from "@/app/money"
import { useSelectedMonth } from "@/app/month"
import { useAppStyle } from "@/app/style"
import { useScreenTour } from "@/tours/useTour"
import { saveBuckets, undoMove, type BucketInput } from "@mizan/core/db/plan"
import type { AppStyle } from "@mizan/core/domain/appStyle"
import { BASIS_POINTS } from "@mizan/core/domain/money/split"
import { basisPointsToPercent, rebalance } from "@mizan/core/domain/plan/figures"
import { useMonthView } from "./useMonthFigures"

/** New buckets take the template's next preset; the colour is then stored on the bucket like any other. */
export const BUCKET_PRESETS: Record<AppStyle, readonly string[]> = {
  mizan: ["#2f5fc4", "#10897a", "#b07f0d", "#c4523b", "#8b4fa6", "#6a8a26", "#5b6b86", "#c24d78"],
  clear: ["#0071e3", "#c45500", "#1b7f3a", "#8944ab", "#007d94", "#c3135e", "#8a6100", "#5146d6"],
  soft: ["#2985df", "#cc6600", "#0a9645", "#976dd9", "#009294", "#d5587c", "#ae7800", "#768595"],
}

const share = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.max(0, Math.round((part / whole) * 100))) : 0)

/** Everything the Plan page knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function usePlanPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const currency = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const [draft, setDraft] = useState<BucketInput[] | null>(null)
  const [moving, setMoving] = useState(false)
  const presets = BUCKET_PRESETS[useAppStyle()]
  useScreenTour("plan", view.buckets.length > 0)

  useEffect(() => {
    setDraft(null)
  }, [monthKey, view.plan?.id])

  const editing: BucketInput[] = draft ?? view.buckets.map((b) => ({ id: b.id, name: b.name, colour: b.colour, shareBasisPoints: b.shareBasisPoints, fixedAmount: b.fixedAmount, carryOver: b.carryOver }))
  const totalShares = editing.filter((b) => b.fixedAmount === null).reduce((sum, b) => sum + b.shareBasisPoints, 0)
  const fixedTotal = editing.reduce((sum, b) => sum + (b.fixedAmount ?? 0), 0)
  const gapShares = totalShares - BASIS_POINTS
  const gapAmount = Math.round(((view.income.planned - fixedTotal) * gapShares) / BASIS_POINTS)
  const money = (amount: number) => formatMoney(amount, currency, i18n.language)

  const rows = view.figures.buckets.map((figure) => {
    const bucket = view.buckets.find((b) => b.id === figure.id)!
    const spentPercent = share(figure.spent, figure.allocated)
    return {
      id: figure.id,
      name: bucket.name,
      colour: bucket.colour,
      carryOver: bucket.carryOver,
      fixedAmount: bucket.fixedAmount,
      sharePercent: basisPointsToPercent(bucket.shareBasisPoints),
      figure,
      spentPercent,
      committedPercent: Math.min(100 - spentPercent, share(figure.committed, figure.allocated)),
      state: figure.free < 0 ? ("over" as const) : figure.free === 0 && figure.allocated > 0 ? ("full" as const) : ("ok" as const),
    }
  })
  const allocatedTotal = rows.reduce((sum, row) => sum + row.figure.allocated, 0)
  const freeTotal = rows.reduce((sum, row) => sum + row.figure.free, 0)

  function update(index: number, patch: Partial<BucketInput>) {
    setDraft(editing.map((b, i) => (i === index ? { ...b, ...patch } : b)))
  }

  return {
    monthKey, setMonthKey, startDay, currency, view, money, rows, editing,
    date: (iso: string) => formatWhen(iso, i18n.language, { day: "numeric", month: "short" }),
    bucketName: (id: string) => view.buckets.find((b) => b.id === id)?.name ?? "?",
    allocatedTotal, freeTotal,
    usedPercent: share(allocatedTotal - freeTotal, allocatedTotal),
    widthOf: (amount: number) => share(amount, allocatedTotal),
    dirty: draft !== null,
    canMove: view.buckets.length > 1,
    gapShares, gapAmount,
    balance: gapShares === 0
      ? t("plan.balanced")
      : gapShares > 0
        ? t("plan.over", { percent: basisPointsToPercent(gapShares), amount: money(gapAmount) })
        : t("plan.under", { percent: basisPointsToPercent(-gapShares), amount: money(-gapAmount) }),
    fixedExcess: view.figures.fixedTotal > view.income.planned && view.income.planned > 0 ? view.figures.fixedTotal - view.income.planned : 0,
    presets,
    update,
    remove: (index: number) => setDraft(editing.filter((_, i) => i !== index)),
    add: () => setDraft([...editing, { name: "", colour: presets[editing.length % presets.length], shareBasisPoints: 0, fixedAmount: null, carryOver: false }]),
    rebalance: () => {
      const scaled = rebalance(editing.map((x) => (x.fixedAmount === null ? x.shareBasisPoints : 0)))
      setDraft(editing.map((b, i) => ({ ...b, shareBasisPoints: b.fixedAmount === null ? scaled[i] : 0 })))
    },
    save: async () => {
      await saveBuckets(monthKey, editing.filter((b) => b.name.trim() !== ""))
      setDraft(null)
      toast(t("plan.saved"))
    },
    undoMove,
    moving, setMoving,
  }
}

export type PlanPageModel = ReturnType<typeof usePlanPage>
export type PlanRow = PlanPageModel["rows"][number]
