import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { Sync } from "@/screens/sync"

export default function SyncScreen() {
  const { t } = useTranslation()
  return (
    <>
      <Stack.Screen options={{ title: t("sync.title") }} />
      <Sync />
    </>
  )
}
