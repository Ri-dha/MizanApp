import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useBillsScreen } from "./use-bills-screen"
import { BillsSoft } from "./views/bills-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: BillsSoft }

export function Bills() {
  const { t } = useTranslation()
  const model = useBillsScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("bills.title"), headerRight: () => <Button testID="add-bill" variant="ghost" title={t("bills.add")} onPress={model.add} /> }} />
      <View model={model} />
    </Screen>
  )
}
