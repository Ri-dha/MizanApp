import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useJoinScreen } from "./use-join-screen"
import { JoinSoft } from "./views/join-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: JoinSoft }

export function JoinHousehold({ token }: { token: string }) {
  const { t } = useTranslation()
  const model = useJoinScreen(token)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: t("household.joinTitle") }} />
      <View model={model} />
    </Screen>
  )
}
