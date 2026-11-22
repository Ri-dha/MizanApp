import { router } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { NO_ACCOUNT, pickedAccount } from "@mizan/core/db/accountChoice"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { liveDebts } from "@mizan/core/db/debts"
import { liveGoals } from "@mizan/core/db/goals"
import { microsToRate, RATE_SCALE, rateToMicros } from "@mizan/core/db/income"
import { isMonthClosed, liveMonthCloses } from "@mizan/core/db/networth"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { createSplit, createTransaction, deleteTransaction, updateTransaction } from "@mizan/core/db/transactions"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { suggestCategory } from "@mizan/core/domain/categorise"
import { fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { Bucket, CounterpartyType, LedgerTransaction, TransactionType } from "@mizan/core/schema"
import { rows, table } from "@mizan/core/store/store"
import { useAppMode } from "@/hooks/use-app-mode"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useTodayRate } from "@/hooks/use-currency"
import { lastAccount, rememberAccount } from "@/utils/last-account"

const TYPES: TransactionType[] = ["EXPENSE", "TRANSFER", "INCOME"]
const SUGGEST_AFTER_MS = 300
const HISTORY_LIMIT = 2000
const NO_BUCKETS: Bucket[] = []
const NO_ROWS: LedgerTransaction[] = []

/**
 * FR-TRX-01: amount, a bucket and Save are the only required taps; the date defaults to today.
 * The same sheet edits an existing row when given its id. The templates only decide how it is drawn (ADR styles-1).
 */
export function useTransactionEditor(id?: string) {
  const { t } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const existing = useLiveQuery(() => (id ? table("transactions").get(id) : Promise.resolve(undefined)), [id], undefined)
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))

  const [type, setType] = useState<TransactionType>("EXPENSE")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(base)
  const [rate, setRate] = useState("1")
  const todayRate = useTodayRate(base)
  const pickCurrency = (code: string) => {
    setCurrency(code)
    setRate(todayRate(code))
  }
  const [occurredOn, setOccurredOn] = useState(todayIso())
  const [bucketId, setBucketId] = useState<string | null>(null)
  // ADR mode-1: simple mode records money in and out with no bucket. A bucket transfer opened for editing keeps its form.
  const bucketless = useAppMode() === "simple" && type !== "TRANSFER"
  const types = bucketless ? TYPES.filter((choice) => choice !== "TRANSFER") : TYPES
  const [counterparty, setCounterparty] = useState<string | null>(null)
  const [payee, setPayee] = useState("")
  const [category, setCategory] = useState("")
  const [note, setNote] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [split, setSplit] = useState(false)
  const [parts, setParts] = useState<{ bucketId: string | null; amount: string }[]>([])
  const [suggested, setSuggested] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(!id)
  const [attachmentId, setAttachmentId] = useState<string | null>(null)
  const [draftId] = useState(() => id ?? crypto.randomUUID())
  const [accountId, setAccountId] = useState(() => (id ? NO_ACCOUNT : lastAccount()))

  const monthKey = monthKeyFor(occurredOn, startDay)
  const buckets = useLiveQuery(async () => liveBucketsOf(planFor(await livePlans(), monthKey)?.id), [monthKey], NO_BUCKETS)
  const goals = useLiveQuery(liveGoals, [], [])
  const debts = useLiveQuery(liveDebts, [], [])
  const accounts = useLiveQuery(liveCashAccounts, [], [])
  const history = useLiveQuery(
    async () => (await rows("transactions", (x) => x.deletedAt === null && x.type === "EXPENSE")).slice(-HISTORY_LIMIT),
    [], NO_ROWS,
  )

  useEffect(() => {
    if (!existing || loaded) return
    setType(existing.type)
    setAmount(fromMinorUnits(existing.amount, existing.currency))
    setCurrency(existing.currency)
    setRate(microsToRate(existing.fxRateMicros, existing.currency, base))
    setOccurredOn(existing.occurredOn)
    setBucketId(existing.bucketId)
    setCounterparty(existing.counterpartyType && existing.counterpartyId ? `${existing.counterpartyType}:${existing.counterpartyId}` : null)
    setPayee(existing.payee ?? "")
    setCategory(existing.category ?? "")
    setNote(existing.note ?? "")
    setIsPrivate(existing.visibility === "PRIVATE")
    setAttachmentId(existing.attachmentId ?? null)
    setAccountId(existing.cashAccountId ?? NO_ACCOUNT)
    setLoaded(true)
  }, [existing, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.transactions === "PRIVATE")
  }, [id, privacy.transactions])

  useEffect(() => {
    if (id || type !== "EXPENSE" || !payee.trim() || category.trim()) return
    const timer = setTimeout(() => {
      const suggestion = suggestCategory(payee, note, history)
      if (!suggestion) return
      setCategory(suggestion.category)
      setSuggested(suggestion.category)
      if (!bucketless && !bucketId && suggestion.bucketId && buckets.some((b) => b.id === suggestion.bucketId)) setBucketId(suggestion.bucketId)
    }, SUGGEST_AFTER_MS)
    return () => clearTimeout(timer)
  }, [payee, note, type, id, category, bucketId, buckets, history, bucketless])

  const counterparties = useMemo(() => [
    ...buckets.filter((b) => b.id !== bucketId).map((b) => ({ value: `BUCKET:${b.id}`, label: `${t("transactions.bucket")}: ${b.name}` })),
    ...goals.map((g) => ({ value: `GOAL:${g.id}`, label: `${t("nav.goals")}: ${g.name}` })),
    ...debts.map((d) => ({ value: `DEBT:${d.id}`, label: `${t("nav.debts")}: ${d.name}` })),
    ...accounts.map((c) => ({ value: `CASH_ACCOUNT:${c.id}`, label: `${t("nav.accounts")}: ${c.name}` })),
  ], [buckets, goals, debts, accounts, bucketId, t])

  const needsRate = currency !== base
  const splitTotal = parts.reduce((sum, p) => sum + (p.amount ? toMinorUnits(p.amount, currency) : 0), 0)
  const splitRemainder = toMinorUnits(amount || "0", currency) - splitTotal
  const partOfSplit = !!existing?.splitGroupId
  const canSave = !!amount && (type === "INCOME" || bucketless || split || !!bucketId)

  async function save() {
    setProblem(null)
    if (isMonthClosed(monthKey, await liveMonthCloses())) {
      setProblem(t("networth.monthClosed", { month: monthKey }))
      return
    }
    const [counterpartyType, counterpartyId] = counterparty ? (counterparty.split(":") as [CounterpartyType, string]) : [null, null]
    const input = {
      type, occurredOn, monthKey, amount: toMinorUnits(amount, currency), currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE,
      bucketId: type === "INCOME" ? null : bucketId,
      category: category.trim() || null, payee: payee.trim() || null, note: note.trim() || null,
      counterpartyType: type === "TRANSFER" ? counterpartyType : null,
      counterpartyId: type === "TRANSFER" ? counterpartyId : null,
      attachmentId,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
      assetId: type === "EXPENSE" ? (existing?.assetId ?? null) : null,
    }
    const moves = type === "EXPENSE" || type === "INCOME"
    const cashAccountId = moves ? pickedAccount(accountId, accounts) : null
    // Rewriting an unchanged account would count the record again after a balance set by hand (ADR cash-1).
    const account = !moves || (existing && (existing.cashAccountId ?? null) === cashAccountId) ? {} : { cashAccountId }
    if (moves) rememberAccount(accountId)
    if (id) await updateTransaction(id, { ...input, ...account })
    else if (split && type === "EXPENSE") {
      const splitParts = parts.filter((p) => p.bucketId && p.amount).map((p) => ({ bucketId: p.bucketId!, amount: toMinorUnits(p.amount, currency) }))
      if (splitParts.reduce((sum, p) => sum + p.amount, 0) !== input.amount) {
        setProblem(t("transactions.splitMismatch"))
        return
      }
      await createSplit({ ...input, ...account }, splitParts)
    } else await createTransaction({ ...input, ...account })
    router.back()
  }

  async function remove() {
    if (!id) return
    await deleteTransaction(id)
    router.back()
  }

  return {
    id, editing: !!id, type, setType, types, amount, setAmount, currency, pickCurrency, rate, setRate, needsRate,
    occurredOn, setOccurredOn, bucketId, setBucketId, bucketless, buckets, accounts, accountId, setAccountId,
    bucketChips: buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour })),
    counterparties, counterparty, setCounterparty,
    split, parts, splitRemainder, splitRemainderText: fromMinorUnits(splitRemainder, currency),
    toggleSplit: (on: boolean) => {
      setSplit(on)
      if (on && parts.length === 0) setParts([{ bucketId: null, amount: "" }])
    },
    updatePart: (index: number, patch: Partial<{ bucketId: string | null; amount: string }>) => setParts(parts.map((p, i) => (i === index ? { ...p, ...patch } : p))),
    addPart: () => setParts([...parts, { bucketId: null, amount: "" }]),
    payee, setPayee, category, note, setNote,
    setCategory: (value: string) => {
      setCategory(value)
      setSuggested(null)
    },
    showSuggested: !!suggested && suggested === category,
    isPrivate, setIsPrivate, attachmentId, setAttachmentId, draftId, problem, partOfSplit, canSave,
    save: () => void save(),
    remove: () => void remove(),
  }
}

export type TransactionEditorModel = ReturnType<typeof useTransactionEditor>
