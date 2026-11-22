import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useDataScreen } from "./use-data-screen"
import { DataSoft } from "./views/data-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: DataSoft }

export function DataSettings() {
  const { t } = useTranslation()
  const model = useDataScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("data.title") }} />
      <View model={model} />
    </Screen>
  )
}
