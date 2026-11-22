import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useIncomeScreen } from "./use-income-screen"
import { IncomeSoft } from "./views/income-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: IncomeSoft }

export function Income() {
  const { t } = useTranslation()
  const model = useIncomeScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("income.title"), headerRight: () => <Button testID="add-source" variant="ghost" title={t("income.addSource")} onPress={model.addSource} /> }} />
      <View model={model} />
    </Screen>
  )
}
