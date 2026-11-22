import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useLotScreen } from "./use-lot-screen"
import { LotSoft } from "./views/lot-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: LotSoft }

export function LotEditor({ id }: { id?: string }) {
  const { t } = useTranslation()
  const model = useLotScreen(id)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.editing ? t("metals.editLot") : t("metals.addLot"), headerRight: () => <Button testID="save-lot" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
