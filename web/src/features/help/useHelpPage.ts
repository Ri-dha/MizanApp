import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

import { pageFor, pagesFor } from "@/help/manual"

/** The manual, bundled with the app so it reads offline; the same Markdown builds /docs. */
export function useHelpPage() {
  const { i18n } = useTranslation()
  const { slug } = useParams()
  const lang = i18n.language.startsWith("ar") ? "ar" : "en"
  const pages = useMemo(() => pagesFor(lang), [lang])
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  return {
    lang,
    page: slug ? pageFor(lang, slug) : undefined,
    query,
    setQuery,
    shown: pages.filter((p) => !needle || p.title.toLowerCase().includes(needle) || p.summary.toLowerCase().includes(needle) || p.body.toLowerCase().includes(needle)),
  }
}

export type HelpPageModel = ReturnType<typeof useHelpPage>
