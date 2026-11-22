import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useHelpScreen } from "./use-help-screen"
import { HelpSoft } from "./views/help-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: HelpSoft }

export function Help() {
  const { t } = useTranslation()
  const model = useHelpScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("help.title") }} />
      <View model={model} />
    </Screen>
  )
}
