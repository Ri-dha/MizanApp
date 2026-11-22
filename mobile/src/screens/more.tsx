import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useMoreScreen } from "./use-more-screen"
import { MoreSoft } from "./views/more-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: MoreSoft }

export function More() {
  const { t } = useTranslation()
  const model = useMoreScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("nav.more") }} />
      <View model={model} />
    </Screen>
  )
}
