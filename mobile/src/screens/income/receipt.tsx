import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useIncomeReceiptScreen } from "./use-income-receipt-screen"
import { IncomeReceiptSoft } from "./views/income-receipt-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: IncomeReceiptSoft }

export function IncomeReceiptSheet(props: Parameters<typeof useIncomeReceiptScreen>[0]) {
  const { t } = useTranslation()
  const model = useIncomeReceiptScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.receiptId ? t("income.editReceipt") : model.planned ? t("income.markReceived") : t("income.addIrregular"), headerRight: () => <Button testID="save-receipt" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
