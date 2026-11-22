import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { pickedAccount } from "@mizan/core/db/accountChoice"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { balanceOf, livePayments, recordPayment, undoPayment } from "@mizan/core/db/debts"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { debtPayoff } from "@mizan/core/domain/debt/payoff"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { SHORT_DATE, formatDay } from "@/utils/dates"
import { lastAccount, rememberAccount } from "@/utils/last-account"

export function useDebtDetailScreen({ id }: { id: string }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const debt = useLiveQuery(() => table("debts").get(id), [id], undefined)
  const payments = useLiveQuery(livePayments, [], [])
  const [amount, setAmount] = useState("")
  const [paidOn, setPaidOn] = useState(todayIso())
  const [extra, setExtra] = useState("")
  const accounts = useLiveQuery(liveCashAccounts, [], [])
  const [accountId, setAccountId] = useState(lastAccount)
  if (!debt) return null

  const money = (value: number) => formatMoney(value, debt.currency, i18n.language)
  const date = (iso: string) => formatDay(iso, i18n.language, SHORT_DATE)
  const balance = balanceOf(debt, payments)
  const ledger = payments.filter((p) => p.debtId === debt.id).reverse()
  const payoff = debtPayoff(balance, debt.annualRateBasisPoints, debt.monthlyPayment)
  const extraMinor = extra ? toMinorUnits(extra, debt.currency) : 0
  const withExtra = extraMinor > 0 ? debtPayoff(balance, debt.annualRateBasisPoints, debt.monthlyPayment + extraMinor) : null
  const active = debt.status === "ACTIVE"

  async function pay() {
    if (!debt) return
    const paid = toMinorUnits(amount || fromMinorUnits(debt.monthlyPayment, debt.currency), debt.currency)
    const cashAccountId = pickedAccount(accountId, accounts)
    rememberAccount(accountId)
    await recordPayment(debt, payments, paid, paidOn, monthKeyFor(paidOn, startDay), null, cashAccountId)
    setAmount("")
  }

  const outlook = debt.status === "SETTLED"
    ? t("debts.settled")
    : payoff.neverClears
      ? t("debts.neverClearsLong", { payment: money(debt.monthlyPayment) })
      : t("debts.payoffLong", { months: payoff.months, total: money(payoff.totalPaid), interest: money(payoff.totalInterest) })

  return { debt, amount, setAmount, paidOn, setPaidOn, extra, setExtra, accounts, accountId, setAccountId, money, date, balance, ledger, payoff, withExtra, active, outlook, paidPercent: debt.principal > 0 ? Math.max(0, Math.min(100, Math.round(((debt.principal - balance) / debt.principal) * 100))) : 0, paymentPlaceholder: fromMinorUnits(debt.monthlyPayment, debt.currency), pay: () => void pay(), undo: (payment: (typeof ledger)[number]) => void undoPayment(payment), edit: () => router.push({ pathname: "/debt-edit", params: { id: debt.id } }) }
}

export type DebtDetailModel = NonNullable<ReturnType<typeof useDebtDetailScreen>>
