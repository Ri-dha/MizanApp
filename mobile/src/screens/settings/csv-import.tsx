import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useCsvImportScreen } from "./use-csv-import-screen"
import { CsvImportSoft } from "./views/csv-import-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: CsvImportSoft }

export function CsvImport() {
  const { t } = useTranslation()
  const model = useCsvImportScreen()
  const View = viewFor(VIEWS, useAppStyle())
  if (!model.loaded) return <Screen><Stack.Screen options={{ title: t("csv.title") }} /></Screen>
  return (
    <Screen>
      <Stack.Screen options={{ title: t("csv.title"), headerRight: () => <Button testID="csv-commit" variant="ghost" title={t("csv.import", { count: model.importCount })} disabled={!model.canCommit} onPress={model.commit} /> }} />
      <View model={model} />
    </Screen>
  )
}
