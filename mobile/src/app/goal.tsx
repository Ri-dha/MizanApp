import { useLocalSearchParams } from "expo-router"

import { GoalEditor } from "@/screens/goals/editor"

export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <GoalEditor id={id} />
}
