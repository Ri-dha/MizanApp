import { useLocalSearchParams } from "expo-router"

import { BillPaid } from "@/screens/bills/paid"

export default function BillPaidScreen() {
  const { id, dueDate, monthKey } = useLocalSearchParams<{ id: string; dueDate: string; monthKey: string }>()
  return <BillPaid id={id} dueDate={dueDate} monthKey={monthKey} />
}
