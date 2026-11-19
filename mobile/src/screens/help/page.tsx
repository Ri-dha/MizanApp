import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { Markdown } from "@/components/markdown"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { manualPages, phoneScreenFor } from "./pages"

export function HelpPage({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation()
  const page = manualPages(i18n.language).find((p) => p.slug === slug)
  if (!page) return <Screen><Stack.Screen options={{ title: t("help.title") }} /></Screen>
  const screen = phoneScreenFor(page.screen)
  return (
    <Screen>
      <Stack.Screen options={{ title: t("help.title"), headerLargeTitle: false }} />
      <ThemedText variant="largeTitle">{page.title}</ThemedText>
      {page.lang !== (i18n.language.startsWith("ar") ? "ar" : "en") ? <ThemedText variant="caption">{t("help.englishOnly")}</ThemedText> : null}
      <Markdown source={page.body} />
      {screen ? <Button testID="help-open-screen" variant="secondary" title={t("help.openScreen")} onPress={() => router.navigate(screen)} /> : null}
    </Screen>
  )
}
