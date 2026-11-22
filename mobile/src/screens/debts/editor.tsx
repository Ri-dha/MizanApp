import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useDebtEditorScreen } from "./use-debt-editor-screen"
import { DebtEditorSoft } from "./views/debt-editor-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: DebtEditorSoft }

export function DebtEditor(props: Parameters<typeof useDebtEditorScreen>[0]) {
  const { t } = useTranslation()
  const model = useDebtEditorScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.id ? t("debts.edit") : t("debts.add"), headerRight: () => <Button testID="save-debt" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
