import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useSettingsScreen } from "./use-settings-screen"
import { SettingsSoft } from "./views/settings-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: SettingsSoft }

export function Settings() {
  const { t } = useTranslation()
  const model = useSettingsScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("settings.title") }} />
      <View model={model} />
    </Screen>
  )
}
