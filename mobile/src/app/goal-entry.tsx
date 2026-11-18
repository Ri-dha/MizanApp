import { useLocalSearchParams } from "expo-router"

import type { GoalDeposit } from "@mizan/core/schema"
import { GoalEntry } from "@/screens/goals/entry"

export default function GoalEntryScreen() {
  const { id, direction } = useLocalSearchParams<{ id: string; direction: GoalDeposit["direction"] }>()
  return <GoalEntry id={id} direction={direction} />
}
