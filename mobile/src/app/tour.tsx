import { useLocalSearchParams } from "expo-router"

import { Tour } from "@/screens/tour"

export default function TourScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <Tour id={id} />
}
