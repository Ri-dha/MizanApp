import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useGoalEditorScreen } from "./use-goal-editor-screen"
import { GoalEditorSoft } from "./views/goal-editor-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: GoalEditorSoft }

export function GoalEditor(props: Parameters<typeof useGoalEditorScreen>[0]) {
  const { t } = useTranslation()
  const model = useGoalEditorScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.id ? t("goals.edit") : t("goals.add"), headerRight: () => <Button testID="save-goal" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
