import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useMarketSettingsScreen } from "./use-settings-screen"
import { MarketSettingsSoft } from "./views/settings-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: MarketSettingsSoft }

export function MarketSettings() {
  const { t } = useTranslation()
  const model = useMarketSettingsScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("metals.settings"), headerRight: () => <Button testID="save-market-settings" variant="ghost" title={t("accounts.save")} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
