import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useDebtsScreen } from "./use-debts-screen"
import { DebtsSoft } from "./views/debts-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: DebtsSoft }

export function Debts() {
  const { t } = useTranslation()
  const model = useDebtsScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("debts.title"), headerRight: () => <Button testID="add-debt" variant="ghost" title={t("debts.add")} onPress={model.add} /> }} />
      <View model={model} />
    </Screen>
  )
}
