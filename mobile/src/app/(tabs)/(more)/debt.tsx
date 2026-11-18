import { useLocalSearchParams } from "expo-router"

import { DebtDetail } from "@/screens/debts/detail"

export default function DebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DebtDetail id={id} />
}
