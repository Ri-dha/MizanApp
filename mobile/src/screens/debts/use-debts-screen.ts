import { router } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { balanceOf, liveDebts, livePayments } from "@mizan/core/db/debts"
import { debtPayoff } from "@mizan/core/domain/debt/payoff"
import { compareStrategies } from "@mizan/core/domain/debt/strategy"
import type { Debt } from "@mizan/core/schema"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { formatMoney, toMinorUnits } from "@/utils/money"

const STRATEGIES = ["snowball", "avalanche"] as const

/** Everything the Debts screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useDebtsScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const debts = useLiveQuery(liveDebts, [], [])
  const payments = useLiveQuery(livePayments, [], [])
  const [extra, setExtra] = useState("")
  const money = (amount: number, currency: string) => formatMoney(amount, currency, i18n.language)
  const active = debts.filter((d) => d.direction === "OWING" && d.status === "ACTIVE" && d.currency === base)
  const strategies = active.length > 1
    ? compareStrategies(active.map((d) => ({ id: d.id, balance: Math.max(0, balanceOf(d, payments)), annualRateBasisPoints: d.annualRateBasisPoints, monthlyPayment: d.monthlyPayment })), extra ? toMinorUnits(extra, base) : 0)
    : null
  const nameOf = (id: string) => debts.find((d) => d.id === id)?.name ?? id

  function summary(debt: Debt, balance: number) {
    if (debt.status === "SETTLED") return t("debts.settled")
    const payoff = debtPayoff(balance, debt.annualRateBasisPoints, debt.monthlyPayment)
    if (debt.monthlyPayment <= 0) return t("debts.noPayment")
    return payoff.neverClears ? t("debts.neverClears") : t("debts.payoffSummary", { months: payoff.months, interest: money(payoff.totalInterest, debt.currency) })
  }

  function side(direction: Debt["direction"]) {
    const list = debts.filter((d) => d.direction === direction)
    const open = list.filter((d) => d.status === "ACTIVE")
    return {
      // A total across currencies would mislead, so it shows only when every open debt is in the household's own.
      total: open.every((d) => d.currency === base) ? money(open.reduce((sum, d) => sum + balanceOf(d, payments), 0), base) : null,
      rows: list.map((debt) => {
        const balance = balanceOf(debt, payments)
        return {
          id: debt.id,
          href: { pathname: "/debt" as const, params: { id: debt.id } },
          name: debt.counterparty ? `${debt.name} · ${debt.counterparty}` : debt.name,
          detail: `${debt.annualRateBasisPoints === 0 ? `${t("debts.interestFree")} · ` : ""}${summary(debt, balance)}`,
          balance: money(balance, debt.currency),
          settled: debt.status === "SETTLED",
        }
      }),
    }
  }

  const cheaper = strategies && !strategies.snowball.neverClears && !strategies.avalanche.neverClears
    ? strategies.avalanche.totalInterest < strategies.snowball.totalInterest ? "avalanche" : strategies.snowball.totalInterest < strategies.avalanche.totalInterest ? "snowball" : null
    : null

  return {
    add: () => router.push("/debt-edit"),
    owing: side("OWING"),
    owed: side("OWED"),
    extra, setExtra,
    strategies: strategies ? STRATEGIES.map((name) => {
      const outcome = strategies[name]
      return {
        name,
        cheaper: cheaper === name,
        order: outcome.order.map(nameOf).join(" → "),
        outcome: outcome.neverClears ? t("debts.neverClears") : t("debts.strategyOutcome", { months: outcome.months, interest: money(outcome.totalInterest, base) }),
      }
    }) : null,
    difference: strategies && !strategies.snowball.neverClears && !strategies.avalanche.neverClears
      ? t("debts.strategyDifference", { amount: money(Math.abs(strategies.snowball.totalInterest - strategies.avalanche.totalInterest), base) })
      : null,
  }
}

export type DebtsScreenModel = ReturnType<typeof useDebtsScreen>
