import { useLocalSearchParams } from "expo-router"

import { Report } from "@/screens/support/report"

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <Report id={id} />
}
