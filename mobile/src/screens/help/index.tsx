import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { searchPages } from "@mizan/core/help/manual"
import { LinkRow } from "@/components/link-row"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { manualPages } from "./pages"

/** The manual, bundled with the app so it reads offline; the same Markdown builds the web's /docs. */
export function Help() {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState("")
  const language = i18n.language.startsWith("ar") ? "ar" : "en"
  const shown = searchPages(manualPages(i18n.language), query)
  return (
    <Screen>
      <Stack.Screen options={{ title: t("help.title") }} />
      <TextField testID="help-search" label={t("help.search")} value={query} onChangeText={setQuery} autoCorrect={false} />
      <Group>
        {shown.length === 0 ? <Row last><ThemedText variant="subhead">{t("help.noMatch")}</ThemedText></Row> : null}
        {shown.map((page, index) => (
          <LinkRow key={page.slug} testID={`help-${page.slug}`} href={{ pathname: "/help-page", params: { slug: page.slug } }} last={index === shown.length - 1}>
            <ThemedText>{page.title}</ThemedText>
            <ThemedText variant="caption" numberOfLines={2}>{page.lang !== language ? `${page.summary} · ${t("help.englishOnly")}` : page.summary}</ThemedText>
          </LinkRow>
        ))}
      </Group>
    </Screen>
  )
}
