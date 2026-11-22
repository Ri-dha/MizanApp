import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useAccountTransferScreen } from "./use-account-transfer-screen"
import { AccountTransferSoft } from "./views/account-transfer-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: AccountTransferSoft }

export function AccountTransferEditor(props: Parameters<typeof useAccountTransferScreen>[0]) {
  const { t } = useTranslation()
  const model = useAccountTransferScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  const enough = model.accounts.length >= 2
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.id ? t("cashMovements.editTransfer") : t("cashMovements.transfer"), headerRight: enough ? () => <Button testID="save-transfer" variant="ghost" title={t("accounts.save")} disabled={!model.valid} onPress={model.save} /> : undefined }} />
      <View model={model} />
    </Screen>
  )
}
