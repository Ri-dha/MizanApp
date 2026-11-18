import { useLocalSearchParams } from "expo-router"

import { BillEditor } from "@/screens/bills/editor"

export default function BillEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <BillEditor id={id} />
}
