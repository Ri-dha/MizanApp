import { useLocalSearchParams } from "expo-router"

import { LotEditor } from "@/screens/metals/lot"

export default function Screen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <LotEditor id={id} />
}
