import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useNewScreen } from "./use-new-screen"
import { NewSoft } from "./views/new-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: NewSoft }

export function NewReport() {
  const { t } = useTranslation()
  const model = useNewScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("support.new") }} />
      <View model={model} />
    </Screen>
  )
}
