import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useBillEditorScreen } from "./use-bill-editor-screen"
import { BillEditorSoft } from "./views/bill-editor-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: BillEditorSoft }

export function BillEditor(props: Parameters<typeof useBillEditorScreen>[0]) {
  const { t } = useTranslation()
  const model = useBillEditorScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.id ? t("bills.edit") : t("bills.add"), headerRight: () => <Button testID="save-bill" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
