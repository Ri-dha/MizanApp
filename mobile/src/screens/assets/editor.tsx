import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useAssetEditorScreen } from "./use-asset-editor-screen"
import { AssetEditorSoft } from "./views/asset-editor-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: AssetEditorSoft }

export function AssetEditor(props: Parameters<typeof useAssetEditorScreen>[0]) {
  const { t } = useTranslation()
  const model = useAssetEditorScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.id ? t("assets.edit") : t("assets.add"), headerRight: () => <Button testID="save-asset" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
