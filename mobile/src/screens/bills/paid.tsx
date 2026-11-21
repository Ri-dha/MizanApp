import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { NO_ACCOUNT, pickedAccount } from "@mizan/core/db/accountChoice"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { markBillPaid } from "@mizan/core/db/expenses"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import { AccountField } from "@/components/account-field"
import { Button } from "@/components/button"
import { DateField } from "@/components/date-field"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useMonthView } from "@/hooks/use-views"

export function BillPaid({ id, dueDate, monthKey }: { id: string; dueDate: string; monthKey: string }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const view = useMonthView(monthKey, session?.monthStartDay ?? 1)
  const bill = view.bills.find((b) => b.expense.id === id && b.dueDate === dueDate)
  const [actual, setActual] = useState("")
  const [paidOn, setPaidOn] = useState(() => (dueDate <= todayIso() ? dueDate : todayIso()))
  const accounts = useLiveQuery(liveCashAccounts, [], [])
  const [paidFrom, setPaidFrom] = useState(NO_ACCOUNT)

  useEffect(() => {
    if (bill && actual === "") setActual(fromMinorUnits(bill.expense.amount, bill.expense.currency))
  }, [bill, actual])

  async function save() {
    if (!bill) return
    await markBillPaid(bill, monthKey, toMinorUnits(actual, bill.expense.currency), paidOn, pickedAccount(paidFrom, accounts))
    router.back()
  }

  const title = bill ? `${t("bills.markPaid")}: ${bill.expense.name}` : t("bills.markPaid")
  return (
    <Screen sheet>
      <Stack.Screen options={{ title, headerRight: () => <Button testID="save-bill-paid" variant="ghost" title={t("accounts.save")} disabled={!bill || !actual} onPress={() => void save()} /> }} />
      <TextField testID="bill-actual" label={t("bills.actualAmount")} keyboardType="decimal-pad" value={actual} onChangeText={setActual} />
      {bill?.expense.isEstimate ? (
        <ThemedText variant="caption">{t("bills.estimateHint", { amount: formatMoney(bill.expectedAmount, bill.expense.currency, i18n.language) })}</ThemedText>
      ) : null}
      <DateField label={t("bills.paidOnLabel")} value={paidOn} onChange={(iso) => iso && setPaidOn(iso)} />
      <AccountField testID="bill-paid-from" label={t("cashMovements.paidFrom")} value={paidFrom} onChange={setPaidFrom} accounts={accounts} />
    </Screen>
  )
}
