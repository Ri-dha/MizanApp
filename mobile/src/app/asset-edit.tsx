import { useLocalSearchParams } from "expo-router"

import { AssetEditor } from "@/screens/assets/editor"

export default function AssetEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <AssetEditor id={id} />
}
