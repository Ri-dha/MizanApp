import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useAccountEditorScreen } from "./use-account-editor-screen"
import { AccountEditorSoft } from "./views/account-editor-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: AccountEditorSoft }

export function AccountEditor(props: Parameters<typeof useAccountEditorScreen>[0]) {
  const { t } = useTranslation()
  const model = useAccountEditorScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.id ? t("accounts.edit") : t("accounts.add"), headerRight: () => <Button testID="save-account" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
