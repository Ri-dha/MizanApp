import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { saveBuckets, type BucketInput } from "@mizan/core/db/plan"
import { BASIS_POINTS } from "@mizan/core/domain/money/split"
import { basisPointsToPercent, percentToBasisPoints, rebalance } from "@mizan/core/domain/plan/figures"
import { useSession } from "@/hooks/use-core"
import { useMonthView } from "@/hooks/use-views"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"

/** The web's bucket colours; tapping a swatch steps to the next one, as a phone has no colour input. */
const PALETTE = ["#88aaee", "#ffdc58", "#ff6b6b", "#a3e635", "#c4a1ff", "#fd9745", "#7fdbca"]

/** Everything the buckets editor knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useBucketsScreen(monthKey: string) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const currency = session?.baseCurrency ?? "IQD"
  const view = useMonthView(monthKey, startDay)
  const [draft, setDraft] = useState<BucketInput[] | null>(null)

  useEffect(() => setDraft(null), [monthKey, view.plan?.id])

  const editing: BucketInput[] = draft ?? view.buckets.map((b) => ({ id: b.id, name: b.name, colour: b.colour, shareBasisPoints: b.shareBasisPoints, fixedAmount: b.fixedAmount, carryOver: b.carryOver }))
  const totalShares = editing.filter((b) => b.fixedAmount === null).reduce((sum, b) => sum + b.shareBasisPoints, 0)
  const fixedTotal = editing.reduce((sum, b) => sum + (b.fixedAmount ?? 0), 0)
  const gapShares = totalShares - BASIS_POINTS
  const gapAmount = Math.round(((view.income.planned - fixedTotal) * gapShares) / BASIS_POINTS)
  const money = (amount: number) => formatMoney(amount, currency, i18n.language)
  const update = (index: number, patch: Partial<BucketInput>) => setDraft(editing.map((b, i) => (i === index ? { ...b, ...patch } : b)))

  async function save() {
    await saveBuckets(monthKey, editing.filter((b) => b.name.trim() !== ""))
    router.back()
  }

  return {
    editing, changed: draft !== null,
    versionNote: view.plan ? t("plan.versionNote", { from: view.plan.effectiveFrom }) : t("plan.noPlan"),
    shareOf: (bucket: BucketInput) => String(basisPointsToPercent(bucket.shareBasisPoints)),
    fixedOf: (bucket: BucketInput) => fromMinorUnits(bucket.fixedAmount ?? 0, currency),
    setName: (index: number, name: string) => update(index, { name }),
    setShare: (index: number, value: string) => update(index, { shareBasisPoints: percentToBasisPoints(Number(value) || 0) }),
    setFixed: (index: number, value: string) => update(index, { fixedAmount: toMinorUnits(value, currency) }),
    toggleFixed: (index: number, on: boolean) => update(index, { fixedAmount: on ? 0 : null, shareBasisPoints: on ? 0 : editing[index].shareBasisPoints }),
    setCarryOver: (index: number, carryOver: boolean) => update(index, { carryOver }),
    stepColour: (index: number) => update(index, { colour: PALETTE[(PALETTE.indexOf(editing[index].colour) + 1) % PALETTE.length] }),
    remove: (index: number) => setDraft(editing.filter((_, i) => i !== index)),
    add: () => setDraft([...editing, { name: "", colour: PALETTE[editing.length % PALETTE.length], shareBasisPoints: 0, fixedAmount: null, carryOver: false }]),
    balanced: gapShares === 0,
    balanceText: gapShares === 0
      ? t("plan.balanced")
      : gapShares > 0
        ? t("plan.over", { percent: basisPointsToPercent(gapShares), amount: money(gapAmount) })
        : t("plan.under", { percent: basisPointsToPercent(-gapShares), amount: money(-gapAmount) }),
    rebalance: () => {
      const scaled = rebalance(editing.map((b) => (b.fixedAmount === null ? b.shareBasisPoints : 0)))
      setDraft(editing.map((b, i) => ({ ...b, shareBasisPoints: b.fixedAmount === null ? scaled[i] : 0 })))
    },
    save: () => void save(),
  }
}

export type BucketsScreenModel = ReturnType<typeof useBucketsScreen>
