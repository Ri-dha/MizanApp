import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useHomeLayoutScreen } from "@/screens/home/use-home-layout-screen"
import { HomeLayoutSoft } from "@/screens/home/views/home-layout-soft"
import { SheetList } from "@/screens/home/views/sheet-list"
import { useAppStyle } from "@/theme"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: HomeLayoutSoft }

export function HomeLayoutEditor() {
  const { t } = useTranslation()
  const model = useHomeLayoutScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("homeLayout.title"), headerBackButtonDisplayMode: "minimal", headerRight: () => <Button testID="add-card" variant="ghost" title={t("homeLayout.add")} onPress={() => model.setAdding(true)} /> }} />
      <View model={model} />
      <SheetList visible={model.adding} title={t("homeLayout.templates")} onClose={() => model.setAdding(false)} items={model.templates} onPick={model.add} testID="template" />
    </Screen>
  )
}
