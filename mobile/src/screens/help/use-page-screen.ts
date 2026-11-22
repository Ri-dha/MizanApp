import { router } from "expo-router"
import { useTranslation } from "react-i18next"

import { manualPages, phoneScreenFor } from "./pages"

/** One manual page in the app's language, with the screen it describes when the phone has one. */
export function usePageScreen(slug: string) {
  const { i18n } = useTranslation()
  const page = manualPages(i18n.language).find((p) => p.slug === slug)
  if (!page) return null
  const screen = phoneScreenFor(page.screen)
  return {
    title: page.title,
    body: page.body,
    englishOnly: page.lang !== (i18n.language.startsWith("ar") ? "ar" : "en"),
    openScreen: screen ? () => router.navigate(screen) : null,
  }
}

export type PageScreenModel = NonNullable<ReturnType<typeof usePageScreen>>
