import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useGoalEntryScreen } from "./use-goal-entry-screen"
import { GoalEntrySoft } from "./views/goal-entry-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: GoalEntrySoft }

export function GoalEntry(props: Parameters<typeof useGoalEntryScreen>[0]) {
  const { t } = useTranslation()
  const model = useGoalEntryScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  const verb = t(`goals.${model.direction === "DEPOSIT" ? "deposit" : "withdraw"}`)
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.goal ? `${verb}: ${model.goal.name}` : verb, headerRight: () => <Button testID="save-goal-entry" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
