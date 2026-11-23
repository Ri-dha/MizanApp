import { useLiveQuery } from "dexie-react-hooks"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { formatWhen } from "@/app/dates"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/app/money"
import type { Debt, DebtPayment } from "@/db/schema"
import { lastAccount, pickedAccount, rememberAccount } from "@/features/accounts/lastAccount"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { balanceOf, recordPayment, undoPayment } from "@mizan/core/db/debts"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { debtPayoff } from "@mizan/core/domain/debt/payoff"

export interface DebtDetailProps {
  debt: Debt | null
  payments: DebtPayment[]
  startDay: number
  onClose: () => void
  onEdit: (debt: Debt) => void
}

export function useDebtDetail({ debt, payments, startDay, onEdit }: DebtDetailProps) {
  const { t, i18n } = useTranslation()
  const [amount, setAmount] = useState("")
  const [paidOn, setPaidOn] = useState(todayIso())
  const [extra, setExtra] = useState("")
  const [accountId, setAccountId] = useState(lastAccount)
  const accounts = useLiveQuery(liveCashAccounts, [], [])

  if (!debt) return null

  const money = (value: number) => formatMoney(value, debt.currency, i18n.language)
  const date = (iso: string) => formatWhen(iso, i18n.language, { day: "numeric", month: "short", year: "numeric" })
  const balance = balanceOf(debt, payments)
  const payoff = debtPayoff(balance, debt.annualRateBasisPoints, debt.monthlyPayment)
  const extraMinor = extra ? toMinorUnits(extra, debt.currency) : 0
  const withExtra = extraMinor > 0 ? debtPayoff(balance, debt.annualRateBasisPoints, debt.monthlyPayment + extraMinor) : null
  const paid = Math.max(0, debt.principal - balance)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!debt) return
    const paidNow = toMinorUnits(amount || fromMinorUnits(debt.monthlyPayment, debt.currency), debt.currency)
    const cashAccountId = pickedAccount(accountId, accounts)
    rememberAccount(accountId)
    await recordPayment(debt, payments, paidNow, paidOn, monthKeyFor(paidOn, startDay), null, cashAccountId)
    setAmount("")
  }

  return {
    debt,
    owing: debt.direction === "OWING",
    active: debt.status === "ACTIVE",
    balance: money(balance),
    summary: debt.status === "SETTLED"
      ? t("debts.settled")
      : debt.monthlyPayment <= 0
        ? t("debts.noPaymentLong")
      : payoff.neverClears
        ? t("debts.neverClearsLong", { payment: money(debt.monthlyPayment) })
        : t("debts.payoffLong", { months: payoff.months, total: money(payoff.totalPaid), interest: money(payoff.totalInterest) }),
    paidPercent: debt.principal > 0 ? Math.round((paid / debt.principal) * 100) : 0,
    paidLine: debt.principal > 0 ? t("debts.paidOff", { paid: money(paid), total: money(debt.principal) }) : null,
    amount, setAmount,
    amountPlaceholder: fromMinorUnits(debt.monthlyPayment, debt.currency),
    paidOn, setPaidOn,
    accountId, setAccountId,
    accounts,
    submit,
    canAskWhatIf: debt.status === "ACTIVE" && !payoff.neverClears,
    extra, setExtra,
    whatIf: withExtra && !withExtra.neverClears ? t("debts.whatIfResult", { months: payoff.months - withExtra.months, interest: money(payoff.totalInterest - withExtra.totalInterest) }) : null,
    ledger: payments.filter((p) => p.debtId === debt.id).reverse().map((p) => ({
      payment: p,
      amount: money(p.amount),
      line: `${date(p.paidOn)} · ${t("debts.principalPart", { amount: money(p.principalComponent) })}${p.interestComponent ? ` · ${t("debts.interestPart", { amount: money(p.interestComponent) })}` : ""}`,
    })),
    undo: (payment: DebtPayment) => void undoPayment(payment),
    edit: () => onEdit(debt),
  }
}

export type DebtDetailModel = NonNullable<ReturnType<typeof useDebtDetail>>
