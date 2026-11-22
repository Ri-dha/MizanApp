import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useAssetsScreen } from "./use-assets-screen"
import { AssetsSoft } from "./views/assets-soft"

export { ASSET_TYPES } from "./use-assets-screen"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: AssetsSoft }

export function Assets() {
  const { t } = useTranslation()
  const model = useAssetsScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("assets.title"), headerRight: () => <Button testID="add-asset" variant="ghost" title={t("assets.add")} onPress={model.add} /> }} />
      <View model={model} />
    </Screen>
  )
}
