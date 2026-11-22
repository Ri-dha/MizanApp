import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { usePageScreen } from "./use-page-screen"
import { PageSoft } from "./views/page-soft"

/** ADR styles-1: each template draws the page its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: PageSoft }

export function HelpPage({ slug }: { slug: string }) {
  const { t } = useTranslation()
  const model = usePageScreen(slug)
  const View = viewFor(VIEWS, useAppStyle())
  if (!model) return <Screen><Stack.Screen options={{ title: t("help.title") }} /></Screen>
  return (
    <Screen>
      <Stack.Screen options={{ title: t("help.title"), headerLargeTitle: false }} />
      <View model={model} />
    </Screen>
  )
}
