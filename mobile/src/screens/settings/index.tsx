import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { LinkRow } from "@/components/link-row"
import { Group } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"

/** Step 5 grows this into the web's full Settings; the Home layout comes first (ADR home-1). */
export function Settings() {
  const { t } = useTranslation()
  return (
    <Screen>
      <Stack.Screen options={{ title: t("nav.settings") }} />
      <Group>
        <LinkRow testID="settings-home-layout" href="/home-layout" last>
          <ThemedText>{t("homeLayout.title")}</ThemedText>
          <ThemedText variant="caption" numberOfLines={2}>{t("homeLayout.body")}</ThemedText>
        </LinkRow>
      </Group>
    </Screen>
  )
}
