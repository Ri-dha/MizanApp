import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useMoveMoney } from "./use-move-money"
import { MoveMoneySoft } from "./views/move-money-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: MoveMoneySoft }

export function MoveMoney({ monthKey }: { monthKey: string }) {
  const { t } = useTranslation()
  const model = useMoveMoney(monthKey)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("plan.move"), headerRight: () => <Button testID="confirm-move" variant="ghost" title={t("plan.moveConfirm")} disabled={!model.ready} onPress={model.move} /> }} />
      <View model={model} />
    </Screen>
  )
}
