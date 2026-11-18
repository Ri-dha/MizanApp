import { useLocalSearchParams } from "expo-router"

import { DebtEditor } from "@/screens/debts/editor"

export default function DebtEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <DebtEditor id={id} />
}
