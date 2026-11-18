import { useLocalSearchParams } from "expo-router"

import { IncomeSourceEditor } from "@/screens/income/source"

export default function IncomeSourceScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <IncomeSourceEditor id={id} />
}
