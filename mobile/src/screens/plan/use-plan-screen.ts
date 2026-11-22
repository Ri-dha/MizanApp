import { router } from "expo-router"
import { useTranslation } from "react-i18next"

import { undoMove } from "@mizan/core/db/plan"
import { basisPointsToPercent } from "@mizan/core/domain/plan/figures"
import { useSession } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMonthView } from "@/hooks/use-views"
import { useScreenTour } from "@/tours"
import { formatDay } from "@/utils/dates"
import { formatMoney } from "@/utils/money"

const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
/** From this share of a bucket used, it is flagged as almost used. */
const NEARLY = 90

const share = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.max(0, Math.round((part / whole) * 100))) : 0)

/** Everything the Plan screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function usePlanScreen() {
  const { i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const currency = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const money = (amount: number) => formatMoney(amount, currency, i18n.language)
  const nameOf = (id: string) => view.buckets.find((b) => b.id === id)?.name ?? "?"
  useScreenTour("plan", view.buckets.length > 0)

  const rows = view.figures.buckets.map((figure) => {
    const bucket = view.buckets.find((b) => b.id === figure.id)
    const spentPercent = share(figure.spent, figure.allocated)
    const committedPercent = Math.min(100 - spentPercent, share(figure.committed, figure.allocated))
    return {
      id: figure.id,
      name: bucket?.name ?? "—",
      colour: bucket?.colour ?? null,
      shareLabel: bucket && bucket.fixedAmount === null ? `${basisPointsToPercent(bucket.shareBasisPoints)}%` : "",
      figure, spentPercent, committedPercent,
      state: figure.free < 0 ? ("over" as const)
        : figure.free === 0 && figure.allocated > 0 ? ("full" as const)
          : spentPercent + committedPercent >= NEARLY ? ("near" as const) : ("ok" as const),
    }
  })
  const allocatedTotal = rows.reduce((sum, row) => sum + row.figure.allocated, 0)
  const freeTotal = rows.reduce((sum, row) => sum + row.figure.free, 0)

  return {
    monthKey, setMonthKey, view, money, rows, allocatedTotal, freeTotal,
    usedPercent: share(allocatedTotal - freeTotal, allocatedTotal),
    widthOf: (amount: number) => share(amount, allocatedTotal),
    allReceived: view.income.planned > 0 && view.income.received >= view.income.planned,
    fixedExcess: view.figures.fixedTotal > view.income.planned && view.income.planned > 0 ? view.figures.fixedTotal - view.income.planned : 0,
    canMove: view.buckets.length > 1,
    openMove: () => router.push({ pathname: "/move-money", params: { monthKey } }),
    moves: view.moves.map((move) => ({
      id: move.id,
      title: `${nameOf(move.fromBucketId)} → ${nameOf(move.toBucketId)}`,
      detail: [formatDay(move.movedOn, i18n.language, DAY), money(move.amount), move.reason].filter(Boolean).join(" · "),
      undo: () => void undoMove(move),
    })),
  }
}

export type PlanScreenModel = ReturnType<typeof usePlanScreen>
export type PlanRow = PlanScreenModel["rows"][number]
