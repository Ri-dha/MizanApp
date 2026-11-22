import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useHouseholdScreen } from "./use-household-screen"
import { HouseholdSoft } from "./views/household-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: HouseholdSoft }

export function Household() {
  const { t } = useTranslation()
  const model = useHouseholdScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("household.title") }} />
      <View model={model} />
    </Screen>
  )
}
