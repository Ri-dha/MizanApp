import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useYearReportScreen } from "./use-year-report-screen"
import { YearReportSoft } from "./views/year-report-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: YearReportSoft }

export function YearReport() {
  const { t } = useTranslation()
  const model = useYearReportScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("report.yearTitle", { year: model.year }) }} />
      <View model={model} />
    </Screen>
  )
}
