import { useLiveQuery } from "dexie-react-hooks"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useSession } from "@/api/auth"
import { formatMoney, toMinorUnits } from "@/app/money"
import type { Debt } from "@/db/schema"
import { useMetals } from "@/features/metals/useMetals"
import { balanceOf, liveDebts, livePayments } from "@mizan/core/db/debts"
import { debtPayoff } from "@mizan/core/domain/debt/payoff"
import { compareStrategies } from "@mizan/core/domain/debt/strategy"
import { inBase } from "@mizan/core/market/currency"

export const STRATEGIES = ["snowball", "avalanche"] as const

export function useDebtsPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const base = session?.baseCurrency ?? "IQD"
  const { prices } = useMetals()
  const debts = useLiveQuery(liveDebts, [], [])
  const payments = useLiveQuery(livePayments, [], [])
  const [editing, setEditing] = useState<Debt | null | "new">(null)
  const [detail, setDetail] = useState<Debt | null>(null)
  const [extra, setExtra] = useState("")
  const money = (amount: number, currency: string) => formatMoney(amount, currency, i18n.language)
  const nameOf = (id: string) => debts.find((d) => d.id === id)?.name ?? id

  const active = debts.filter((d) => d.direction === "OWING" && d.status === "ACTIVE" && d.currency === base)
  const compared = active.length > 1 ? compareStrategies(active.map((d) => ({ id: d.id, balance: Math.max(0, balanceOf(d, payments)), annualRateBasisPoints: d.annualRateBasisPoints, monthlyPayment: d.monthlyPayment })), extra ? toMinorUnits(extra, base) : 0) : null
  const bothClear = compared !== null && !compared.snowball.neverClears && !compared.avalanche.neverClears

  function side(direction: Debt["direction"]) {
    const rows = debts.filter((d) => d.direction === direction).map((debt) => {
      const balance = balanceOf(debt, payments)
      const payoff = debtPayoff(balance, debt.annualRateBasisPoints, debt.monthlyPayment)
      return {
        debt,
        title: debt.name + (debt.counterparty ? ` · ${debt.counterparty}` : ""),
        balance: money(balance, debt.currency),
        inBase: inBase(balance, debt.currency, base, prices.perUsd),
        interestFree: debt.annualRateBasisPoints === 0,
        line: debt.status === "SETTLED"
          ? t("debts.settled")
          : debt.monthlyPayment <= 0
            ? t("debts.noPayment")
          : payoff.neverClears
            ? t("debts.neverClears")
            : t("debts.payoffSummary", { months: payoff.months, interest: money(payoff.totalInterest, debt.currency) }),
      }
    })
    // A debt with no rate to the base currency is listed but left out of the headline.
    return { rows, total: money(rows.reduce((sum, r) => sum + (r.inBase ?? 0), 0), base) }
  }

  return {
    owing: side("OWING"),
    owed: side("OWED"),
    extra, setExtra,
    strategies: compared && STRATEGIES.map((name) => {
      const outcome = compared[name]
      const other = compared[name === "snowball" ? "avalanche" : "snowball"]
      const sooner = bothClear && outcome.months < other.months
      const cheaper = bothClear && outcome.months === other.months && outcome.totalInterest < other.totalInterest
      return {
        name,
        order: outcome.order.map(nameOf).join(" → "),
        outcome: outcome.neverClears ? t("debts.neverClears") : t("debts.strategyOutcome", { months: outcome.months, interest: money(outcome.totalInterest, base) }),
        best: sooner ? ("sooner" as const) : cheaper ? ("lessInterest" as const) : null,
      }
    }),
    difference: compared && bothClear ? t("debts.strategyDifference", { amount: money(Math.abs(compared.snowball.totalInterest - compared.avalanche.totalInterest), base) }) : null,
    payments,
    startDay,
    editing, setEditing,
    detail, setDetail,
  }
}

export type DebtsPageModel = ReturnType<typeof useDebtsPage>
