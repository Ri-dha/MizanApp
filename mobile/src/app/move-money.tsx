import { useLocalSearchParams } from "expo-router"

import { MoveMoney } from "@/screens/plan/move-money"

export default function MoveMoneyScreen() {
  const { monthKey } = useLocalSearchParams<{ monthKey: string }>()
  return <MoveMoney monthKey={monthKey} />
}
