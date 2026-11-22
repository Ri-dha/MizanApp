import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useDebtDetailScreen } from "./use-debt-detail-screen"
import { DebtDetailSoft } from "./views/debt-detail-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: DebtDetailSoft }

export function DebtDetail(props: Parameters<typeof useDebtDetailScreen>[0]) {
  const { t } = useTranslation()
  const model = useDebtDetailScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  if (!model) return <Screen><Stack.Screen options={{ title: t("debts.title") }} /></Screen>
  return (
    <Screen>
      <Stack.Screen options={{ title: model.debt.name, headerRight: () => <Button testID="edit-debt" variant="ghost" title={t("debts.edit")} onPress={model.edit} /> }} />
      <View model={model} />
    </Screen>
  )
}
