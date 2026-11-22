import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useDeleteScreen } from "./use-delete-screen"
import { DeleteSoft } from "./views/delete-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: DeleteSoft }

export function DeleteHousehold() {
  const { t } = useTranslation()
  const model = useDeleteScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("household.deleteTitle") }} />
      <View model={model} />
    </Screen>
  )
}
