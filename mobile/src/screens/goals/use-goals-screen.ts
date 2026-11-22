import { router } from "expo-router"
import { useTranslation } from "react-i18next"

import { currentValue, liveAssets, liveValuations } from "@mizan/core/db/assets"
import { liveDeposits, liveGoals, savedOf, undoDeposit } from "@mizan/core/db/goals"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { goalProjection } from "@mizan/core/domain/goal/projection"
import type { Goal } from "@mizan/core/schema"
import { useLiveQuery } from "@/hooks/use-core"
import { SHORT_DATE, formatDay } from "@/utils/dates"
import { formatMoney } from "@/utils/money"

const RECENT_ENTRIES = 3

/** Everything the Goals screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useGoalsScreen() {
  const { t, i18n } = useTranslation()
  const goals = useLiveQuery(liveGoals, [], [])
  const deposits = useLiveQuery(liveDeposits, [], [])
  const assets = useLiveQuery(liveAssets, [], [])
  const valuations = useLiveQuery(liveValuations, [], [])
  const today = todayIso()
  const assetValues = Object.fromEntries(assets.map((a) => [a.id, currentValue(a, valuations, today).value]))
  const money = (value: number, currency: string) => formatMoney(value, currency, i18n.language)
  const date = (iso: string) => formatDay(iso, i18n.language, SHORT_DATE)

  function outlook(goal: Goal, saved: number) {
    const projection = goalProjection(goal.targetAmount, saved, goal.monthlyContribution, goal.targetDate, today)
    const text = goal.status === "COMPLETED" && goal.completedOn
      ? t("goals.completedOn", { date: date(goal.completedOn) })
      : projection.projectedDate
        ? t("goals.projected", { date: date(projection.projectedDate), months: projection.monthsToTarget })
        : projection.requiredMonthly !== null && goal.targetDate
          ? t("goals.required", { amount: money(projection.requiredMonthly, goal.currency), date: date(goal.targetDate) })
          : t("goals.noProjection")
    return { percent: projection.percent, text }
  }

  return {
    add: () => router.push("/goal"),
    goals: goals.filter((g) => g.status !== "ARCHIVED").map((goal) => {
      const saved = savedOf(goal, deposits, assetValues)
      const entry = (direction: "DEPOSIT" | "WITHDRAWAL") => () => router.push({ pathname: "/goal-entry", params: { id: goal.id, direction } })
      return {
        id: goal.id,
        name: goal.name,
        edit: () => router.push({ pathname: "/goal", params: { id: goal.id } }),
        completed: goal.status === "COMPLETED",
        saved: money(saved, goal.currency),
        target: money(goal.targetAmount, goal.currency),
        ...outlook(goal, saved),
        includesSaved: !goal.backingAssetId && (goal.openingAmount ?? 0) > 0 ? t("goals.includesSaved", { amount: money(goal.openingAmount ?? 0, goal.currency) }) : null,
        deposit: entry("DEPOSIT"),
        withdraw: entry("WITHDRAWAL"),
        recent: deposits.filter((d) => d.goalId === goal.id).slice(-RECENT_ENTRIES).reverse().map((e) => ({
          id: e.id,
          text: `${t(`goals.directions.${e.direction}`)} · ${money(e.amount, goal.currency)}`,
          date: date(e.depositedOn),
          undo: () => void undoDeposit(e),
        })),
      }
    }),
  }
}

export type GoalsScreenModel = ReturnType<typeof useGoalsScreen>
