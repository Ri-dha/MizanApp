import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { overAssigned, rowsFrom, sharesFrom, type ShareRow } from "@mizan/core/db/accountChoice"
import { createIncomeSource, historyOf, liveAmountHistory, microsToRate, RATE_SCALE, rateToMicros, recordAmountChange, removeAmountChange, updateIncomeSource } from "@mizan/core/db/income"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import type { Frequency } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useCashAccounts } from "@/hooks/use-views"
import { SHORT_DATE, formatDay } from "@/utils/dates"
import { useTodayRate } from "@/hooks/use-currency"

export const FREQUENCIES: Frequency[] = ["MONTHLY", "BIWEEKLY", "WEEKLY", "ONE_OFF"]
const DEFAULT_PAY_DAY = "25"

export function useIncomeSourceScreen({ id }: { id?: string }) {
  const { i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const source = useLiveQuery(() => (id ? table("incomeSources").get(id) : Promise.resolve(undefined)), [id], undefined)
  const history = useLiveQuery(liveAmountHistory, [], [])
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const todayRate = useTodayRate(base)
  const pickCurrency = (code: string) => {
    setCurrency(code)
    setRate(todayRate(code))
  }
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY")
  const [payDay, setPayDay] = useState(DEFAULT_PAY_DAY)
  const [anchorDate, setAnchorDate] = useState(todayIso())
  const [activeFrom, setActiveFrom] = useState(todayIso())
  const [activeTo, setActiveTo] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)
  const [raiseAmount, setRaiseAmount] = useState("")
  const [raiseFrom, setRaiseFrom] = useState(todayIso())
  const [raiseNote, setRaiseNote] = useState("")
  const [loaded, setLoaded] = useState(!id)
  const [shares, setShares] = useState<ShareRow[]>([])
  const accounts = useCashAccounts()
  const needsRate = currency !== base
  const usesPayDay = frequency === "MONTHLY"
  const oneOff = frequency === "ONE_OFF"
  const money = (value: number, code: string) => formatMoney(value, code, i18n.language)
  const date = (iso: string) => formatDay(iso, i18n.language, SHORT_DATE)
  const timeline = source ? historyOf(source, history) : []

  useEffect(() => {
    if (!source || loaded) return
    setName(source.name)
    setAmount(fromMinorUnits(source.amount, source.currency))
    setCurrency(source.currency)
    setRate(microsToRate(source.fxRateMicros, source.currency, base))
    setFrequency(source.frequency)
    setPayDay(String(source.payDay ?? DEFAULT_PAY_DAY))
    setAnchorDate(source.anchorDate ?? todayIso())
    setActiveFrom(source.activeFrom)
    setActiveTo(source.activeTo)
    setIsPrivate(source.visibility === "PRIVATE")
    setShares(rowsFrom(source.intoAccounts, source.currency))
    setLoaded(true)
  }, [source, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.accounts === "PRIVATE")
  }, [id, privacy.accounts])

  const sourceAmount = source ? source.amount : amount ? toMinorUnits(amount, currency) : 0
  const tooMuch = overAssigned(shares, sourceAmount, currency)

  async function save() {
    if (tooMuch) return
    const input = {
      name: name.trim(),
      amount: source ? source.amount : toMinorUnits(amount, currency),
      currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE,
      frequency,
      payDay: usesPayDay ? Number(payDay) : null,
      anchorDate: usesPayDay ? null : anchorDate,
      activeFrom: oneOff ? anchorDate : activeFrom,
      activeTo: oneOff ? anchorDate : activeTo,
      note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
      intoAccounts: sharesFrom(shares, currency),
    }
    if (id) await updateIncomeSource(id, input)
    else await createIncomeSource(input)
    router.back()
  }

  async function endSource() {
    if (!id) return
    await updateIncomeSource(id, { activeTo: todayIso() })
    router.back()
  }

  async function recordRaise() {
    if (!source) return
    await recordAmountChange(source, toMinorUnits(raiseAmount, source.currency), raiseFrom, raiseNote.trim() || null)
    setRaiseAmount("")
    setRaiseNote("")
  }

  return { id, base, source, name, setName, amount, setAmount, currency, pickCurrency, rate, setRate, frequency, setFrequency, payDay, setPayDay, anchorDate, setAnchorDate, activeFrom, setActiveFrom, activeTo, setActiveTo, isPrivate, setIsPrivate, raiseAmount, setRaiseAmount, raiseFrom, setRaiseFrom, raiseNote, setRaiseNote, shares, setShares, accounts, needsRate, usesPayDay, oneOff, money, date, timeline, sourceAmount, tooMuch, ready: !!name.trim() && !!amount && !tooMuch, save: () => void save(), endSource: () => void endSource(), recordRaise: () => void recordRaise(), removeChange: (entry: (typeof timeline)[number]) => { if (source) void removeAmountChange(entry, source, history) } }
}

export type IncomeSourceModel = ReturnType<typeof useIncomeSourceScreen>
