import { useLocalSearchParams } from "expo-router"

import { PlanBuckets } from "@/screens/plan/buckets"

export default function PlanBucketsScreen() {
  const { monthKey } = useLocalSearchParams<{ monthKey: string }>()
  return <PlanBuckets monthKey={monthKey} />
}
