import { openBrowserAsync } from "expo-web-browser"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { searchPages } from "@mizan/core/help/manual"
import { WEB_ORIGIN } from "@/platform/api-client"
import { manualPages } from "./pages"

/** The manual, bundled with the app so it reads offline; the same Markdown builds the web's /docs. */
export function useHelpScreen() {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState("")
  const language = i18n.language.startsWith("ar") ? "ar" : "en"
  return {
    query, setQuery,
    pages: searchPages(manualPages(i18n.language), query).map((page) => ({
      slug: page.slug,
      title: page.title,
      summary: page.lang !== language ? `${page.summary} · ${t("help.englishOnly")}` : page.summary,
      href: { pathname: "/help-page" as const, params: { slug: page.slug } },
    })),
    openPrivacy: () => void openBrowserAsync(`${WEB_ORIGIN}/privacy.html#${language}`),
  }
}

export type HelpScreenModel = ReturnType<typeof useHelpScreen>
