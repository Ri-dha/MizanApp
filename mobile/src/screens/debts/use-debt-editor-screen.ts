import { router } from "expo-router"
import { useEffect, useState } from "react"

import { NO_ACCOUNT, pickedAccount } from "@mizan/core/db/accountChoice"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { createDebt, updateDebt } from "@mizan/core/db/debts"
import { microsToRate, RATE_SCALE, rateToMicros } from "@mizan/core/db/income"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { softDelete } from "@mizan/core/db/write"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { DebtDirection } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey } from "@/hooks/use-views"
import { useTodayRate } from "@/hooks/use-currency"

export const DIRECTIONS: DebtDirection[] = ["OWING", "OWED"]

export function useDebtEditorScreen({ id }: { id?: string }) {
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const debt = useLiveQuery(() => (id ? table("debts").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const buckets = useLiveQuery(async () => liveBucketsOf(planFor(await livePlans(), currentMonthKey(startDay))?.id), [startDay], [])
  const [direction, setDirection] = useState<DebtDirection>("OWING")
  const [name, setName] = useState("")
  const [counterparty, setCounterparty] = useState("")
  const [principal, setPrincipal] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const todayRate = useTodayRate(base)
  const pickCurrency = (code: string) => {
    setCurrency(code)
    setRate(todayRate(code))
  }
  const [annualPercent, setAnnualPercent] = useState("0")
  const [termMonths, setTermMonths] = useState("")
  const [monthlyPayment, setMonthlyPayment] = useState("")
  const [bucketId, setBucketId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(todayIso())
  const [isPrivate, setIsPrivate] = useState(false)
  const [loaded, setLoaded] = useState(!id)
  const [accountId, setAccountId] = useState(NO_ACCOUNT)
  const accounts = useLiveQuery(liveCashAccounts, [], [])
  const needsRate = currency !== base

  useEffect(() => {
    if (!debt || loaded) return
    setDirection(debt.direction)
    setName(debt.name)
    setCounterparty(debt.counterparty ?? "")
    setPrincipal(fromMinorUnits(debt.principal, debt.currency))
    setCurrency(debt.currency)
    setRate(microsToRate(debt.fxRateMicros, debt.currency, base))
    setAnnualPercent(String(debt.annualRateBasisPoints / 100))
    setTermMonths(debt.termMonths ? String(debt.termMonths) : "")
    setMonthlyPayment(fromMinorUnits(debt.monthlyPayment, debt.currency))
    setBucketId(debt.bucketId)
    setStartDate(debt.startDate)
    setIsPrivate(debt.visibility === "PRIVATE")
    setAccountId(debt.cashAccountId ?? NO_ACCOUNT)
    setLoaded(true)
  }, [debt, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.debts === "PRIVATE")
  }, [id, privacy.debts])

  async function save() {
    const input = {
      name: name.trim(),
      counterparty: counterparty.trim() || null,
      direction,
      principal: toMinorUnits(principal, currency),
      currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE,
      annualRateBasisPoints: Math.round(Number(annualPercent || "0") * 100),
      termMonths: termMonths ? Number(termMonths) : null,
      monthlyPayment: toMinorUnits(monthlyPayment || "0", currency),
      bucketId: direction === "OWING" ? bucketId : null,
      startDate,
      note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    const cashAccountId = pickedAccount(accountId, accounts)
    // ADR cash-2: the link moves money, so it is written only when new or changed (ADR cash-1).
    const account = debt && (debt.cashAccountId ?? null) === cashAccountId ? {} : { cashAccountId }
    if (id) await updateDebt(id, { ...input, ...account })
    else await createDebt({ ...input, ...account })
    router.back()
  }

  async function remove() {
    if (!id) return
    await softDelete("debt", id)
    router.dismissTo("/debts")
  }

  return { id, base, buckets, direction, setDirection, name, setName, counterparty, setCounterparty, principal, setPrincipal, currency, pickCurrency, rate, setRate, annualPercent, setAnnualPercent, termMonths, setTermMonths, monthlyPayment, setMonthlyPayment, bucketId, setBucketId, startDate, setStartDate, isPrivate, setIsPrivate, accountId, setAccountId, accounts, needsRate, ready: !!name.trim() && !!principal, save: () => void save(), remove: () => void remove() }
}

export type DebtEditorModel = ReturnType<typeof useDebtEditorScreen>
