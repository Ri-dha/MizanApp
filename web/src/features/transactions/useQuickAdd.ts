import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { usePrivacyDefaults } from "@/db/privacy"
import { toast } from "sonner"

import { useSession } from "@/api/auth"
import { useAppMode } from "@/app/appMode"
import { attachImage, attachmentObjectUrl, photoExpired, removeAttachment } from "@/attachments/store"
import { liveCashAccounts } from "@mizan/core/db/cashAccounts"
import { liveDebts } from "@mizan/core/db/debts"
import { liveGoals } from "@mizan/core/db/goals"
import { microsToRate, RATE_SCALE, rateToMicros } from "@mizan/core/db/income"
import { liveBucketsOf, livePlans, planFor } from "@mizan/core/db/plan"
import type { Bucket, CounterpartyType, LedgerTransaction, TransactionType } from "@/db/schema"
import { createSplit, createTransaction, deleteTransaction, knownCategories, liveTransactionsFor, updateTransaction } from "@mizan/core/db/transactions"
import { liveAssets } from "@mizan/core/db/assets"
import { suggestCategory } from "@mizan/core/domain/categorise"
import { db } from "@/db/schema"
import { isMonthClosed, liveMonthCloses } from "@mizan/core/db/networth"
import { formatMonthKey } from "@/app/month"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { fromMinorUnits, toMinorUnits } from "@/app/money"
import { useLiveQuery } from "dexie-react-hooks"
import { useTodayRate } from "@/features/currency/useCurrencies"
import { lastAccount, NO_ACCOUNT, rememberAccount } from "@/features/accounts/lastAccount"

const TYPES: TransactionType[] = ["EXPENSE", "TRANSFER", "INCOME"]

export interface QuickAddProps {
  open: boolean
  transaction: LedgerTransaction | null
  onClose: () => void
}

/**
 * FR-TRX-01: amount, a bucket chip and Save are the only required taps; the date defaults to
 * today and everything else is optional. Doubles as the editor for an existing row.
 */
export function useQuickAdd({ open, transaction, onClose }: QuickAddProps) {
  const { t, i18n } = useTranslation()
  const privacy = usePrivacyDefaults()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const [type, setType] = useState<TransactionType>("EXPENSE")
  const [accountId, setAccountId] = useState(NO_ACCOUNT)
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
  const [counterparty, setCounterparty] = useState<string>("")
  const [payee, setPayee] = useState("")
  const [category, setCategory] = useState("")
  const [note, setNote] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [attachmentId, setAttachmentId] = useState<string | null>(null)
  const [split, setSplit] = useState(false)
  const [parts, setParts] = useState<{ bucketId: string; amount: string }[]>([])
  const [assetId, setAssetId] = useState<string>("")
  const assets = useLiveQuery(liveAssets, [], [])
  const history = useLiveQuery(() => db.transactions.filter((x) => x.deletedAt === null && x.type === "EXPENSE").reverse().limit(2000).toArray(), [], [])
  const [suggested, setSuggested] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const buckets = useLiveQuery(async () => liveBucketsOf(planFor(await livePlans(), monthKeyFor(occurredOn, startDay))?.id), [occurredOn, startDay], [] as Bucket[])
  const goals = useLiveQuery(liveGoals, [], [])
  const debts = useLiveQuery(liveDebts, [], [])
  const cashAccounts = useLiveQuery(liveCashAccounts, [], [])
  const categories = useLiveQuery(async () => knownCategories(await liveTransactionsFor(monthKeyFor(occurredOn, startDay))), [occurredOn, startDay], [] as string[])

  useEffect(() => {
    if (!open) return
    setType(transaction?.type ?? "EXPENSE")
    setAccountId(transaction ? transaction.cashAccountId ?? NO_ACCOUNT : lastAccount())
    setAmount(transaction ? fromMinorUnits(transaction.amount, transaction.currency) : "")
    setCurrency(transaction?.currency ?? base)
    setRate(transaction ? microsToRate(transaction.fxRateMicros, transaction.currency, base) : "1")
    setOccurredOn(transaction?.occurredOn ?? todayIso())
    setBucketId(transaction?.bucketId ?? null)
    setCounterparty(transaction?.counterpartyType && transaction.counterpartyId ? `${transaction.counterpartyType}:${transaction.counterpartyId}` : "")
    setPayee(transaction?.payee ?? "")
    setCategory(transaction?.category ?? "")
    setNote(transaction?.note ?? "")
    setIsPrivate(transaction ? transaction.visibility === "PRIVATE" : privacy.transactions === "PRIVATE")
    setAttachmentId(transaction?.attachmentId ?? null)
    setSplit(false)
    setParts([])
    setAssetId(transaction?.assetId ?? "")
  }, [open, transaction, base, privacy])

  const attachment = useLiveQuery(() => (attachmentId ? db.attachments.get(attachmentId) : undefined), [attachmentId])
  const photoRemoved = attachment !== undefined && photoExpired(attachment)

  useEffect(() => {
    let revoked: string | null = null
    if (attachmentId) void attachmentObjectUrl(attachmentId).then((url) => { revoked = url; setPreview(url) })
    else setPreview(null)
    return () => { if (revoked) URL.revokeObjectURL(revoked) }
  }, [attachmentId])

  const needsRate = currency !== base
  const [counterpartyType, counterpartyId] = counterparty ? (counterparty.split(":") as [CounterpartyType, string]) : [null, null]

  async function submit(event: FormEvent) {
    event.preventDefault()
    const targetMonth = monthKeyFor(occurredOn, startDay)
    if (isMonthClosed(targetMonth, await liveMonthCloses())) {
      toast(t("networth.monthClosed", { month: formatMonthKey(targetMonth, i18n.language) }))
      return
    }
    const input = {
      type,
      occurredOn,
      monthKey: monthKeyFor(occurredOn, startDay),
      amount: toMinorUnits(amount, currency),
      currency,
      fxRateMicros: needsRate ? rateToMicros(rate, currency, base) : RATE_SCALE,
      bucketId: type === "INCOME" ? null : bucketId,
      category: category.trim() || null,
      payee: payee.trim() || null,
      note: note.trim() || null,
      counterpartyType: type === "TRANSFER" ? counterpartyType : null,
      counterpartyId: type === "TRANSFER" ? counterpartyId : null,
      attachmentId,
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    const moves = type === "EXPENSE" || type === "INCOME"
    const cashAccountId = moves && cashAccounts.some((c) => c.id === accountId) ? accountId : null
    // Rewriting an unchanged account would count the record again after a balance set by hand (ADR cash-1).
    const account = !moves || (transaction && (transaction.cashAccountId ?? null) === cashAccountId) ? {} : { cashAccountId }
    if (moves) rememberAccount(accountId)
    const withAsset = { ...input, ...account, assetId: type === "EXPENSE" && assetId ? assetId : null }
    if (transaction) await updateTransaction(transaction.id, withAsset)
    else if (split && type === "EXPENSE") {
      const splitParts = parts.filter((p) => p.bucketId && p.amount).map((p) => ({ bucketId: p.bucketId, amount: toMinorUnits(p.amount, currency) }))
      if (splitParts.reduce((s, p) => s + p.amount, 0) !== withAsset.amount) {
        toast(t("transactions.splitMismatch"))
        return
      }
      await createSplit(withAsset, splitParts)
    } else await createTransaction(withAsset)
    onClose()
  }

  const splitTotal = parts.reduce((s, p) => s + (p.amount ? toMinorUnits(p.amount, currency) : 0), 0)
  const splitRemainder = toMinorUnits(amount || "0", currency) - splitTotal

  // Phase 4: the payee alone usually says what this is; fill the category and bucket only while they are still empty.
  useEffect(() => {
    if (transaction || type !== "EXPENSE" || !payee.trim() || category.trim()) return
    const timer = setTimeout(() => {
      const suggestion = suggestCategory(payee, note, history)
      if (!suggestion) return
      setCategory(suggestion.category)
      setSuggested(suggestion.category)
      if (!bucketId && suggestion.bucketId && buckets.some((b) => b.id === suggestion.bucketId)) setBucketId(suggestion.bucketId)
    }, 300)
    return () => clearTimeout(timer)
  }, [payee, note, type, transaction, category, bucketId, buckets, history])

  async function readPhoto() {
    if (!attachmentId) return
    setReading(true)
    try {
      const { attachmentBlob } = await import("@/attachments/store")
      const { readReceipt } = await import("@/ocr/receipt")
      const blob = await attachmentBlob(attachmentId)
      if (!blob) return
      const reading = await readReceipt(blob)
      if (reading.total !== null && !amount) setAmount(fromMinorUnits(toMinorUnits(String(reading.total), currency), currency))
      if (reading.date && !transaction) setOccurredOn(reading.date)
      if (reading.merchant && !payee) setPayee(reading.merchant)
      toast(reading.total !== null ? t("ocr.read", { total: reading.total, date: reading.date ?? "—" }) : t("ocr.nothing"))
    } catch (e) {
      toast(t("ocr.failed", { reason: e instanceof Error ? e.message : String(e) }))
    } finally {
      setReading(false)
    }
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    const id = await attachImage(file, "TRANSACTION", transaction?.id ?? crypto.randomUUID())
    if (attachmentId) await removeAttachment(attachmentId)
    setAttachmentId(id)
  }

  async function remove() {
    if (!transaction) return
    await deleteTransaction(transaction.id)
    toast(t("transactions.deleted"), { action: { label: t("accounts.restore"), onClick: () => void import("@mizan/core/db/transactions").then((m) => m.restoreTransaction(transaction.id)) } })
    onClose()
  }

  const splitting = split && type === "EXPENSE" && !transaction

  return {
    open,
    onClose,
    transaction,
    base,
    types,
    type,
    setType,
    amount,
    setAmount,
    currency,
    pickCurrency,
    needsRate,
    rate,
    setRate,
    bucketless,
    canSplit: type === "EXPENSE" && !transaction && !bucketless,
    split,
    splitting,
    toggleSplit(on: boolean) {
      setSplit(on)
      if (on && parts.length === 0) setParts([{ bucketId: bucketId ?? "", amount: "" }, { bucketId: "", amount: "" }])
    },
    parts,
    setPart: (index: number, change: Partial<{ bucketId: string; amount: string }>) => setParts(parts.map((p, j) => (j === index ? { ...p, ...change } : p))),
    removePart: (index: number) => setParts(parts.filter((_, j) => j !== index)),
    addPart: () => setParts([...parts, { bucketId: "", amount: splitRemainder > 0 ? fromMinorUnits(splitRemainder, currency) : "" }]),
    splitRemainder,
    splitRemainderText: fromMinorUnits(splitRemainder, currency),
    buckets,
    bucketId,
    setBucketId,
    cashAccounts,
    accountId: cashAccounts.some((c) => c.id === accountId) ? accountId : NO_ACCOUNT,
    setAccountId,
    counterparty,
    setCounterparty,
    goals,
    debts,
    occurredOn,
    setOccurredOn,
    payee,
    setPayee,
    category,
    setCategory,
    categorySuggested: suggested !== null && suggested === category,
    categories,
    note,
    setNote,
    heldAssets: type === "EXPENSE" ? assets.filter((a) => a.status === "HELD") : [],
    assetId,
    setAssetId,
    photoRemoved,
    pickPhoto,
    preview,
    reading,
    readPhoto,
    removePhoto() {
      if (attachmentId) void removeAttachment(attachmentId)
      setAttachmentId(null)
    },
    isPrivate,
    setIsPrivate,
    remove,
    submit,
    canSave: Boolean(amount) && !(type !== "INCOME" && !split && !bucketId && buckets.length > 0 && !bucketless) && !(split && (parts.length < 2 || splitRemainder !== 0)),
  }
}

export type QuickAddModel = ReturnType<typeof useQuickAdd>
