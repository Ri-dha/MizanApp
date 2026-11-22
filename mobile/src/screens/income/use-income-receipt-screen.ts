import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { overAssigned, rowsFrom, sharesFrom, type ShareRow } from "@mizan/core/db/accountChoice"
import { currentAmount, liveAmountHistory, microsToRate, RATE_SCALE, rateToMicros, recordReceipt, toBaseAmount } from "@mizan/core/db/income"
import { softDelete, writeFields } from "@mizan/core/db/write"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import type { IncomeReceipt } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useCashAccounts } from "@/hooks/use-views"
import { useTodayRate } from "@/hooks/use-currency"

export interface Props {
  monthKey: string
  sourceId?: string
  date?: string
  receiptId?: string
}

/** Marks a planned payment received, records money that came in without a plan, or corrects either afterwards. */
export function useIncomeReceiptScreen({ monthKey, sourceId, date, receiptId }: Props) {
  const { i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const today = todayIso()
  const existing = useLiveQuery(() => (receiptId ? table("incomeReceipts").get(receiptId) : Promise.resolve(undefined)), [receiptId], undefined)
  const source = useLiveQuery(() => (sourceId ? table("incomeSources").get(sourceId) : Promise.resolve(undefined)), [sourceId], undefined)
  const history = useLiveQuery(liveAmountHistory, [], [])
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const todayRate = useTodayRate(base)
  const pickCurrency = (code: string) => {
    setCurrency(code)
    setRate(todayRate(code))
  }
  const [receivedOn, setReceivedOn] = useState(date && date <= today ? date : today)
  const [note, setNote] = useState("")
  const [loaded, setLoaded] = useState(!receiptId && !sourceId)
  const [shares, setShares] = useState<ShareRow[]>([])
  const accounts = useCashAccounts()

  useEffect(() => {
    if (loaded) return
    if (existing) {
      setAmount(fromMinorUnits(existing.amount, existing.currency))
      setCurrency(existing.currency)
      setRate(microsToRate(existing.fxRateMicros, existing.currency, base))
      setReceivedOn(existing.receivedOn)
      setNote(existing.note ?? "")
      setShares(rowsFrom(existing.intoAccounts, existing.currency))
      setLoaded(true)
    } else if (source) {
      setAmount(fromMinorUnits(currentAmount(source, history, date ?? today), source.currency))
      setCurrency(source.currency)
      setRate(microsToRate(source.fxRateMicros, source.currency, base))
      setShares(rowsFrom(source.intoAccounts, source.currency))
      setLoaded(true)
    }
  }, [existing, source, history, date, today, loaded])

  const needsRate = currency !== base
  const fxRateMicros = needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE
  const minor = amount ? toMinorUnits(amount, currency) : 0

  const tooMuch = overAssigned(shares, minor, currency)

  async function save() {
    if (tooMuch) return
    const intoAccounts = sharesFrom(shares, currency)
    const unchanged = JSON.stringify(intoAccounts) === JSON.stringify(existing?.intoAccounts ?? [])
    // Rewriting an unchanged split would count it again after a balance the person set by hand (ADR cash-1).
    const fields = { receivedOn, amount: minor, currency, fxRateMicros, note: note.trim() || null, ...(existing && unchanged ? {} : { intoAccounts }) }
    if (existing) await writeFields<IncomeReceipt>("income_receipt", existing.id, { ...fields, baseAmount: toBaseAmount(minor, fxRateMicros) })
    else await recordReceipt({ ...fields, incomeSourceId: sourceId ?? null, monthKey, visibility: "SHARED" })
    router.back()
  }

  async function remove() {
    if (!existing) return
    await softDelete("income_receipt", existing.id)
    router.back()
  }

  return { receiptId, base, existing, amount, setAmount, currency, pickCurrency, rate, setRate, receivedOn, setReceivedOn, note, setNote, shares, setShares, accounts, needsRate, minor, tooMuch, planned: sourceId ?? existing?.incomeSourceId, inBase: formatMoney(toBaseAmount(minor, fxRateMicros), base, i18n.language), ready: !!amount && !tooMuch, save: () => void save(), remove: () => void remove() }
}

export type IncomeReceiptModel = ReturnType<typeof useIncomeReceiptScreen>
