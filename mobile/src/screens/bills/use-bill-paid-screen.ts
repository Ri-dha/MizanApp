import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { NO_ACCOUNT, pickedAccount } from "@mizan/core/db/accountChoice"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { markBillPaid } from "@mizan/core/db/expenses"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useMonthView } from "@/hooks/use-views"

export function useBillPaidScreen({ id, dueDate, monthKey }: { id: string; dueDate: string; monthKey: string }) {
  const { i18n } = useTranslation()
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

  return { bill, actual, setActual, paidOn, setPaidOn, accounts, paidFrom, setPaidFrom, ready: !!bill && !!actual, estimate: bill?.expense.isEstimate ? formatMoney(bill.expectedAmount, bill.expense.currency, i18n.language) : null, save: () => void save() }
}

export type BillPaidModel = ReturnType<typeof useBillPaidScreen>
