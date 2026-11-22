import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useBackupScreen } from "./use-backup-screen"
import { BackupSoft } from "./views/backup-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: BackupSoft }

export function BackupSettings() {
  const { t } = useTranslation()
  const model = useBackupScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("backup.title") }} />
      <View model={model} />
    </Screen>
  )
}
