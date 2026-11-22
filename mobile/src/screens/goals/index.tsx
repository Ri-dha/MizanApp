import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useGoalsScreen } from "./use-goals-screen"
import { GoalsSoft } from "./views/goals-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: GoalsSoft }

export function Goals() {
  const { t } = useTranslation()
  const model = useGoalsScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("goals.title"), headerRight: () => <Button testID="add-goal" variant="ghost" title={t("goals.add")} onPress={model.add} /> }} />
      <View model={model} />
    </Screen>
  )
}
