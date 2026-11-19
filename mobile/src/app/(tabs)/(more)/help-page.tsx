import { useLocalSearchParams } from "expo-router"

import { HelpPage } from "@/screens/help/page"

export default function HelpPageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return <HelpPage slug={slug} />
}
