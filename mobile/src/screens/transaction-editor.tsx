import { DateTimePicker } from "@expo/ui/community/datetime-picker"
import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { router, Stack } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

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
import { AccountField } from "@/components/account-field"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Notice } from "@/components/notice"
import { Group } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { spacing, useBrandColors } from "@/theme"
import { dateOf, isoOf } from "@/utils/dates"
import { ReceiptField } from "@/components/receipt-field"
import { CurrencyField } from "@/components/currency-field"
import { useTodayRate } from "@/hooks/use-currency"
import { lastAccount, rememberAccount } from "@/utils/last-account"

const TYPES: TransactionType[] = ["EXPENSE", "TRANSFER", "INCOME"]
const SUGGEST_AFTER_MS = 300
const HISTORY_LIMIT = 2000
const NO_BUCKETS: Bucket[] = []
const NO_ROWS: LedgerTransaction[] = []


/**
 * FR-TRX-01: amount, a bucket and Save are the only required taps; the date defaults to today.
 * The same sheet edits an existing row when given its id.
 */
export function TransactionEditor({ id }: { id?: string }) {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
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
      if (!bucketId && suggestion.bucketId && buckets.some((b) => b.id === suggestion.bucketId)) setBucketId(suggestion.bucketId)
    }, SUGGEST_AFTER_MS)
    return () => clearTimeout(timer)
  }, [payee, note, type, id, category, bucketId, buckets, history])

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
  const canSave = !!amount && (type === "INCOME" || split || !!bucketId)

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

  const bucketChips = buckets.map((b) => ({ value: b.id, label: b.name, swatch: b.colour }))
  return (
    <Screen sheet>
      <Stack.Screen
        options={{
          title: id ? t("transactions.edit") : t("transactions.add"),
          headerRight: () => <Button testID="save-transaction" variant="ghost" title={t("accounts.save")} disabled={!canSave || partOfSplit} onPress={() => void save()} />,
        }}
      />
      {partOfSplit ? <Notice>{t("transactions.partOfSplit")}</Notice> : null}
      <SegmentedControl
        testID="transaction-type"
        values={TYPES.map((value) => t(`transactions.types.${value}`))}
        selectedIndex={TYPES.indexOf(type)}
        onChange={(event) => setType(TYPES[event.nativeEvent.selectedSegmentIndex])}
      />
      <View style={styles.amountRow}>
        <View style={styles.amount}>
          <TextField testID="new-amount" label={t("transactions.amount")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} autoFocus={!id} />
        </View>
        <View style={styles.currency}>
          <CurrencyField testID="transaction-currency" value={currency} onChange={pickCurrency} />
        </View>
      </View>
      {needsRate ? <TextField testID="fx-rate" label={t("income.fxRate")} keyboardType="decimal-pad" value={rate} onChangeText={setRate} /> : null}
      <View style={styles.dateRow}>
        <ThemedText>{t("transactions.date")}</ThemedText>
        <DateTimePicker value={dateOf(occurredOn)} mode="date" display="compact" accentColor={brand.primary} locale={i18n.language} onChange={(_, date) => date && setOccurredOn(isoOf(date))} />
      </View>

      {type !== "INCOME" && !split ? (
        <View style={styles.field}>
          <ThemedText variant="subhead">{type === "TRANSFER" ? t("transactions.fromBucket") : t("transactions.bucket")}</ThemedText>
          {buckets.length === 0 ? <ThemedText variant="subhead">{t("plan.noBuckets")}</ThemedText> : <Chips testID="bucket" options={bucketChips} value={bucketId} onChange={setBucketId} />}
        </View>
      ) : null}

      {type === "EXPENSE" || type === "INCOME" ? (
        <AccountField testID="transaction-account" label={type === "EXPENSE" ? t("cashMovements.paidFrom") : t("cashMovements.intoAccount")}
          value={accountId} onChange={setAccountId} accounts={accounts} />
      ) : null}

      {type === "TRANSFER" ? (
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("transactions.to")}</ThemedText>
          <Chips testID="counterparty" options={counterparties} value={counterparty} onChange={setCounterparty} />
        </View>
      ) : null}

      {type === "EXPENSE" && !id ? <ToggleRow testID="split" label={t("transactions.split")} value={split} onChange={(on) => { setSplit(on); if (on && parts.length === 0) setParts([{ bucketId: null, amount: "" }]) }} /> : null}
      {split ? (
        <Group>
          <View style={styles.parts}>
            {parts.map((part, index) => (
              <View key={index} style={styles.field}>
                <Chips options={bucketChips} value={part.bucketId} onChange={(value) => setParts(parts.map((p, i) => (i === index ? { ...p, bucketId: value } : p)))} />
                <TextField label={t("transactions.amount")} keyboardType="decimal-pad" value={part.amount} onChangeText={(value) => setParts(parts.map((p, i) => (i === index ? { ...p, amount: value } : p)))} />
              </View>
            ))}
            <ThemedText variant="subhead" style={splitRemainder !== 0 ? { color: brand.destructive } : null}>
              {t("transactions.splitRemainder", { amount: fromMinorUnits(splitRemainder, currency) })}
            </ThemedText>
            <Button variant="secondary" title={t("transactions.addPart")} onPress={() => setParts([...parts, { bucketId: null, amount: "" }])} />
          </View>
        </Group>
      ) : null}

      <TextField testID="new-payee" label={t("transactions.payee")} value={payee} onChangeText={setPayee} />
      <TextField testID="new-category" label={t("transactions.category")} value={category} onChangeText={(value) => { setCategory(value); setSuggested(null) }} />
      {suggested && suggested === category ? <ThemedText variant="caption">{t("transactions.suggested")}</ThemedText> : null}
      <TextField testID="new-note" label={t("income.note")} value={note} onChangeText={setNote} multiline />
      <ReceiptField attachmentId={attachmentId} ownerType="TRANSACTION" ownerRecordId={draftId} onChange={setAttachmentId} />
      <ToggleRow testID="private" label={t("accounts.private")} value={isPrivate} onChange={setIsPrivate} />
      {problem ? <Notice tone="error" testID="editor-problem">{problem}</Notice> : null}
      {id ? <Button testID="delete-transaction" variant="destructive" title={t("accounts.delete")} onPress={() => void remove()} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  amountRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  amount: { flex: 3 },
  currency: { flex: 2, gap: spacing.xs },
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  field: { gap: spacing.xs },
  parts: { padding: spacing.md, gap: spacing.md },
})
