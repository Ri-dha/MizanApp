import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { Markdown } from "@/components/markdown"
import { Card } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import type { PageScreenModel } from "../use-page-screen"

/** Soft: the page's title, then the text in one reading card, and the way to the screen it describes. */
export function PageSoft({ model }: { model: PageScreenModel }) {
  const { t } = useTranslation()
  return (
    <>
      <ThemedText variant="largeTitle" accessibilityRole="header">{model.title}</ThemedText>
      {model.englishOnly ? <ThemedText variant="caption">{t("help.englishOnly")}</ThemedText> : null}
      <Card><Markdown source={model.body} /></Card>
      {model.openScreen ? <Button testID="help-open-screen" variant="secondary" title={t("help.openScreen")} onPress={model.openScreen} /> : null}
    </>
  )
}
