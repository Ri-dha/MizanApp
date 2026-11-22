import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useReportScreen } from "./use-report-screen"
import { ReportSoft } from "./views/report-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: ReportSoft }

export function Report({ id }: { id: string }) {
  const { t } = useTranslation()
  const model = useReportScreen(id)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: model.report?.subject ?? t("support.title"), headerLargeTitle: false }} />
      <View model={model} />
    </Screen>
  )
}
