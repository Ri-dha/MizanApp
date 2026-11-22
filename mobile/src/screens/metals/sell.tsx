import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import type { Metal } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useSellScreen } from "./use-sell-screen"
import { SellSoft } from "./views/sell-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: SellSoft }

export function SellMetal({ metal }: { metal: Metal }) {
  const { t } = useTranslation()
  const model = useSellScreen(metal)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.title, headerRight: () => <Button testID="confirm-sale" variant="ghost" title={t("metals.confirmSale")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
