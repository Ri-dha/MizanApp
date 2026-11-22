import { Stack } from "expo-router"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useHomeScreen } from "./use-home-screen"
import { HomeSoft } from "./views/home-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: HomeSoft }

export function Home() {
  const model = useHomeScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: model.title }} />
      <View model={model} />
    </Screen>
  )
}
