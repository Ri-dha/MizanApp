import { useLocalSearchParams } from "expo-router"

import { IncomeReceiptSheet } from "@/screens/income/receipt"

export default function IncomeReceiptScreen() {
  const params = useLocalSearchParams<{ monthKey: string; sourceId?: string; date?: string; receiptId?: string }>()
  return <IncomeReceiptSheet {...params} />
}
