import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useMetalsScreen } from "./use-metals-screen"
import { MetalsSoft } from "./views/metals-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: MetalsSoft }

export function Metals() {
  const { t } = useTranslation()
  const model = useMetalsScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("metals.title"), headerRight: () => <Button testID="add-lot" variant="ghost" title={t("metals.addLot")} onPress={model.addLot} /> }} />
      <View model={model} />
    </Screen>
  )
}
