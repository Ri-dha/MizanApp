import { router } from "expo-router"
import { useEffect, useState } from "react"

import { createRecurringExpense, updateRecurringExpense } from "@mizan/core/db/expenses"
import { microsToRate, RATE_SCALE, rateToMicros } from "@mizan/core/db/income"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { SUBSCRIPTION_CATEGORY, isSubscription } from "@mizan/core/domain/expense/subscriptions"
import { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { ExpenseFrequency, RecurringExpense } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey } from "@/hooks/use-views"
import { useTodayRate } from "@/hooks/use-currency"

export const FREQUENCIES: ExpenseFrequency[] = ["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"]
const MAX_REMINDER_DAYS = 30
const DEFAULT_INTERVAL_DAYS = "30"

export function useBillEditorScreen({ id }: { id?: string }) {
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const expense = useLiveQuery(() => (id ? table("recurringExpenses").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const buckets = useLiveQuery(async () => liveBucketsOf(planFor(await livePlans(), currentMonthKey(startDay))?.id), [startDay], [])
  const [name, setName] = useState("")
  const [bucketId, setBucketId] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [isEstimate, setIsEstimate] = useState(false)
  const [reminderDays, setReminderDays] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const todayRate = useTodayRate(base)
  const pickCurrency = (code: string) => {
    setCurrency(code)
    setRate(todayRate(code))
  }
  const [frequency, setFrequency] = useState<ExpenseFrequency>("MONTHLY")
  const [dueDay, setDueDay] = useState("1")
  const [anchorDate, setAnchorDate] = useState(todayIso())
  const [intervalDays, setIntervalDays] = useState(DEFAULT_INTERVAL_DAYS)
  const [activeFrom, setActiveFrom] = useState(todayIso())
  const [activeTo, setActiveTo] = useState<string | null>(null)
  const [category, setCategory] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [loaded, setLoaded] = useState(!id)
  const needsRate = currency !== base

  useEffect(() => {
    if (!expense || loaded) return
    setName(expense.name)
    setBucketId(expense.bucketId)
    setAmount(fromMinorUnits(expense.amount, expense.currency))
    setIsEstimate(expense.isEstimate)
    setReminderDays(expense.reminderDays == null ? "" : String(expense.reminderDays))
    setCurrency(expense.currency)
    setRate(microsToRate(expense.fxRateMicros, expense.currency, base))
    setFrequency(expense.frequency)
    setDueDay(String(expense.dueDay ?? 1))
    setAnchorDate(expense.anchorDate ?? todayIso())
    setIntervalDays(String(expense.intervalDays ?? DEFAULT_INTERVAL_DAYS))
    setActiveFrom(expense.activeFrom)
    setActiveTo(expense.activeTo)
    setCategory(expense.category ?? "")
    setIsPrivate(expense.visibility === "PRIVATE")
    setLoaded(true)
  }, [expense, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.transactions === "PRIVATE")
  }, [id, privacy.transactions])

  useEffect(() => {
    if (!id && bucketId === null && buckets[0]) setBucketId(buckets[0].id)
  }, [id, bucketId, buckets])

  async function save() {
    const input = {
      name: name.trim(),
      bucketId,
      amount: toMinorUnits(amount, currency),
      isEstimate,
      reminderDays: reminderDays.trim() === "" ? null : Math.max(0, Math.min(MAX_REMINDER_DAYS, Number(reminderDays))),
      currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE,
      frequency,
      dueDay: frequency === "MONTHLY" ? Number(dueDay) : null,
      anchorDate: frequency === "MONTHLY" ? null : anchorDate,
      intervalDays: frequency === "CUSTOM" ? Number(intervalDays) : null,
      activeFrom,
      activeTo,
      category: category.trim() || null,
      note: null,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateRecurringExpense(id, input)
    else await createRecurringExpense(input)
    router.back()
  }

  async function end() {
    if (!id) return
    await updateRecurringExpense(id, { activeTo: todayIso() })
    router.back()
  }

  return { id, base, buckets, name, setName, bucketId, setBucketId, amount, setAmount, isEstimate, setIsEstimate, reminderDays, setReminderDays, currency, pickCurrency, rate, setRate, frequency, setFrequency, dueDay, setDueDay, anchorDate, setAnchorDate, intervalDays, setIntervalDays, activeFrom, setActiveFrom, activeTo, setActiveTo, category, setCategory, isPrivate, setIsPrivate, needsRate, ready: !!name.trim() && !!amount, subscription: isSubscription({ category } as RecurringExpense), setSubscription: (on: boolean) => setCategory(on ? SUBSCRIPTION_CATEGORY : ""), save: () => void save(), end: () => void end() }
}

export type BillEditorModel = ReturnType<typeof useBillEditorScreen>
