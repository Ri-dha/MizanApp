import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useExplainScreen } from "./use-explain-screen"
import { ExplainSoft } from "./views/explain-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: ExplainSoft }

export function PriceExplainer() {
  const { t } = useTranslation()
  const model = useExplainScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("metals.howCalculated") }} />
      <View model={model} />
    </Screen>
  )
}
