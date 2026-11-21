import { Stack } from "expo-router"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { shows, type AdvancedArea } from "@mizan/core/domain/appMode"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useAppMode } from "@/hooks/use-app-mode"
import { setPreferences } from "@/preferences"

/** A screen simple mode leaves out: a deep link or notification lands on a way back in, not on a blank page. */
export function AreaGate({ area, children }: { area: AdvancedArea; children: ReactNode }) {
  const { t } = useTranslation()
  const mode = useAppMode()
  if (shows(mode, area)) return children
  return (
    <Screen>
      <Stack.Screen options={{ title: t("appMode.gateTitle") }} />
      <ThemedText variant="subhead">{t("appMode.gateBody")}</ThemedText>
      <Button testID="switch-to-advanced" title={t("appMode.switchToAdvanced")} onPress={() => setPreferences({ appMode: "advanced" })} />
    </Screen>
  )
}
