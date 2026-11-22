import { router } from "expo-router"
import { useState } from "react"

import { liveDeposits, recordDeposit } from "@mizan/core/db/goals"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { toMinorUnits } from "@mizan/core/domain/money/format"
import type { GoalDeposit } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"

export function useGoalEntryScreen({ id, direction }: { id: string; direction: GoalDeposit["direction"] }) {
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const goal = useLiveQuery(() => table("goals").get(id), [id], undefined)
  const [amount, setAmount] = useState("")
  const [on, setOn] = useState(todayIso())

  async function save() {
    if (!goal) return
    await recordDeposit(goal, await liveDeposits(), toMinorUnits(amount, goal.currency), direction, on, monthKeyFor(on, startDay), null)
    router.back()
  }

  return { goal, direction, amount, setAmount, on, setOn, ready: !!amount, save: () => void save() }
}

export type GoalEntryModel = ReturnType<typeof useGoalEntryScreen>
