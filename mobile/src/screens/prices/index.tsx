import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { usePricesScreen } from "./use-prices-screen"
import { PricesSoft } from "./views/prices-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: PricesSoft }

export function Prices() {
  const { t } = useTranslation()
  const model = usePricesScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("prices.title") }} />
      <View model={model} />
    </Screen>
  )
}
