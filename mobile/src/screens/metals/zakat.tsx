import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useZakatScreen } from "./use-zakat-screen"
import { ZakatSoft } from "./views/zakat-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: ZakatSoft }

export function Zakat() {
  const { t } = useTranslation()
  const model = useZakatScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("zakat.title") }} />
      <View model={model} />
    </Screen>
  )
}
