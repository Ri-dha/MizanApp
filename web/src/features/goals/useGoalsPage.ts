import { useLiveQuery } from "dexie-react-hooks"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { formatWhen } from "@/app/dates"
import { formatMoney, toMinorUnits } from "@/app/money"
import type { Goal, GoalDeposit } from "@/db/schema"
import { currentValue, liveAssets, liveValuations } from "@mizan/core/db/assets"
import { liveDeposits, liveGoals, recordDeposit, savedOf, undoDeposit } from "@mizan/core/db/goals"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { goalProjection } from "@mizan/core/domain/goal/projection"

const LEDGER_SHOWN = 3

export type GoalState = "reached" | "onTrack" | "behind" | null

export function useGoalsPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const goals = useLiveQuery(liveGoals, [], [])
  const deposits = useLiveQuery(liveDeposits, [], [])
  const assets = useLiveQuery(liveAssets, [], [])
  const valuations = useLiveQuery(liveValuations, [], [])
  const [editing, setEditing] = useState<Goal | null | "new">(null)
  const [depositing, setDepositing] = useState<{ goal: Goal; direction: GoalDeposit["direction"] } | null>(null)
  const [amount, setAmount] = useState("")
  const [on, setOn] = useState(todayIso())
  const today = todayIso()
  const assetValues = Object.fromEntries(assets.map((a) => [a.id, currentValue(a, valuations, today).value]))

  const money = (value: number, currency: string) => formatMoney(value, currency, i18n.language)
  const date = (iso: string) => formatWhen(iso, i18n.language, { day: "numeric", month: "short", year: "numeric" })

  async function submitDeposit(event: FormEvent) {
    event.preventDefault()
    if (!depositing) return
    await recordDeposit(depositing.goal, deposits, toMinorUnits(amount, depositing.goal.currency), depositing.direction, on, monthKeyFor(on, startDay), null)
    setDepositing(null)
    setAmount("")
  }

  return {
    cards: goals.filter((g) => g.status !== "ARCHIVED").map((goal) => {
      const saved = savedOf(goal, deposits, assetValues)
      const projection = goalProjection(goal.targetAmount, saved, goal.monthlyContribution, goal.targetDate, today)
      const reached = goal.status === "COMPLETED"
      // The monthly deposit lands after the date the person asked for: behind. Without both there is nothing to judge.
      const state: GoalState = reached ? "reached" : projection.projectedDate === null ? null : goal.targetDate !== null && projection.projectedDate > goal.targetDate ? "behind" : "onTrack"
      return {
        goal,
        state,
        saved: money(saved, goal.currency),
        target: money(goal.targetAmount, goal.currency),
        percent: projection.percent,
        includesSaved: !goal.backingAssetId && (goal.openingAmount ?? 0) > 0 ? t("goals.includesSaved", { amount: money(goal.openingAmount ?? 0, goal.currency) }) : null,
        note: reached && goal.completedOn
          ? t("goals.completedOn", { date: date(goal.completedOn) })
          : projection.projectedDate
            ? t("goals.projected", { date: date(projection.projectedDate), months: projection.monthsToTarget })
            : projection.requiredMonthly !== null && goal.targetDate
              ? t("goals.required", { amount: money(projection.requiredMonthly, goal.currency), date: date(goal.targetDate) })
              : t("goals.noProjection"),
        ledger: deposits.filter((d) => d.goalId === goal.id).slice(-LEDGER_SHOWN).reverse().map((d) => ({ deposit: d, label: `${date(d.depositedOn)} · ${t(`goals.directions.${d.direction}`)}`, amount: money(d.amount, goal.currency) })),
      }
    }),
    editing, setEditing,
    depositing, setDepositing,
    amount, setAmount,
    on, setOn,
    submitDeposit,
    undo: (deposit: GoalDeposit) => void undoDeposit(deposit),
  }
}

export type GoalsPageModel = ReturnType<typeof useGoalsPage>
