import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useAdvisorScreen } from "./use-advisor-screen"
import { AdvisorSoft } from "./views/advisor-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: AdvisorSoft }

export function Advisor() {
  const { t } = useTranslation()
  const model = useAdvisorScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("advisor.title", { household: model.household }) }} />
      <View model={model} />
    </Screen>
  )
}
