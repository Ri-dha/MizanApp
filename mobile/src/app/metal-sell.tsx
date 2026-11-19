import { useLocalSearchParams } from "expo-router"

import type { Metal } from "@mizan/core/schema"
import { SellMetal } from "@/screens/metals/sell"

export default function Screen() {
  const { metal } = useLocalSearchParams<{ metal: Metal }>()
  return <SellMetal metal={metal} />
}
