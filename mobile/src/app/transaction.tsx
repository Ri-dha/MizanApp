import { useLocalSearchParams } from "expo-router"

import { TransactionEditor } from "@/screens/transaction-editor"

export default function TransactionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <TransactionEditor id={id} />
}
