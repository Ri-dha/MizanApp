import { useLocalSearchParams } from "expo-router"

import { AssetActionSheet, type AssetAction } from "@/screens/assets/action"

export default function AssetActionScreen() {
  const { id, kind } = useLocalSearchParams<{ id: string; kind: AssetAction }>()
  return <AssetActionSheet id={id} kind={kind} />
}
