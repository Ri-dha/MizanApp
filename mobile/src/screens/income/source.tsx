import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useIncomeSourceScreen } from "./use-income-source-screen"
import { IncomeSourceSoft } from "./views/income-source-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: IncomeSourceSoft }

export function IncomeSourceEditor(props: Parameters<typeof useIncomeSourceScreen>[0]) {
  const { t } = useTranslation()
  const model = useIncomeSourceScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.id ? t("income.editSource") : t("income.addSource"), headerRight: () => <Button testID="save-source" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
