import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useAssetActionScreen } from "./use-asset-action-screen"
import { AssetActionSoft } from "./views/asset-action-soft"

export type { AssetAction } from "./use-asset-action-screen"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: AssetActionSoft }

export function AssetActionSheet(props: Parameters<typeof useAssetActionScreen>[0]) {
  const { t } = useTranslation()
  const model = useAssetActionScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  const verb = t(model.selling ? "assets.sell" : "assets.addValuation")
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.asset ? `${verb}: ${model.asset.name}` : verb, headerRight: () => <Button testID="save-asset-action" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
