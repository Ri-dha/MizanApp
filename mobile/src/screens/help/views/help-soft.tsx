import { useTranslation } from "react-i18next"
import { Pressable } from "react-native"

import { LinkRow } from "@/components/link-row"
import { Group, Row } from "@/components/row"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import type { HelpScreenModel } from "../use-help-screen"

/** Soft: the search field over one list of topics, each with a bold title and its summary. */
export function HelpSoft({ model }: { model: HelpScreenModel }) {
  const { t } = useTranslation()
  return (
    <>
      <TextField testID="help-search" label={t("help.search")} value={model.query} onChangeText={model.setQuery} autoCorrect={false} />
      <Group>
        {model.pages.length === 0 ? <Row last><ThemedText variant="subhead">{t("help.noMatch")}</ThemedText></Row> : null}
        {model.pages.map((page, index) => (
          <LinkRow key={page.slug} testID={`help-${page.slug}`} href={page.href} last={index === model.pages.length - 1}>
            <ThemedText variant="headline">{page.title}</ThemedText>
            <ThemedText variant="caption" numberOfLines={2}>{page.summary}</ThemedText>
          </LinkRow>
        ))}
      </Group>
      <Group>
        <Pressable testID="help-privacy" accessibilityRole="link" onPress={model.openPrivacy}>
          <Row last trailing={<ThemedText variant="subhead">↗</ThemedText>}><ThemedText>{t("help.privacy")}</ThemedText></Row>
        </Pressable>
      </Group>
    </>
  )
}
