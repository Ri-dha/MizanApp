import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useBillPaidScreen } from "./use-bill-paid-screen"
import { BillPaidSoft } from "./views/bill-paid-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: BillPaidSoft }

export function BillPaid(props: Parameters<typeof useBillPaidScreen>[0]) {
  const { t } = useTranslation()
  const model = useBillPaidScreen(props)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: model.bill ? `${t("bills.markPaid")}: ${model.bill.expense.name}` : t("bills.markPaid"), headerRight: () => <Button testID="save-bill-paid" variant="ghost" title={t("accounts.save")} disabled={!model.ready} onPress={model.save} /> }} />
      <View model={model} />
    </Screen>
  )
}
