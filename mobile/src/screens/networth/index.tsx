import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useNetWorthScreen } from "./use-networth-screen"
import { NetWorthSoft } from "./views/networth-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: NetWorthSoft }

export function NetWorth() {
  const { t } = useTranslation()
  const model = useNetWorthScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("networth.title") }} />
      <View model={model} />
    </Screen>
  )
}
