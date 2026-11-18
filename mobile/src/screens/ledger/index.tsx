import { Link } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native"

import { logout } from "@mizan/core/auth/session"
import { livePlans, liveBucketsOf, planFor } from "@mizan/core/db/plan"
import { createTransaction } from "@mizan/core/db/transactions"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney, toMinorUnits } from "@mizan/core/domain/money/format"
import type { LedgerTransaction } from "@mizan/core/schema"
import { rows, sorted } from "@mizan/core/store/store"
import { syncNow } from "@mizan/core/sync/engine"
import { useLiveQuery, useSession, useSyncStatus } from "@/hooks/use-core"

const NO_ROWS: LedgerTransaction[] = []
const UNIT_RATE_MICROS = 1_000_000

export function Ledger() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const status = useSyncStatus()
  const base = session?.baseCurrency ?? "IQD"
  const transactions = useLiveQuery(() => sorted(rows("transactions", (row) => row.deletedAt === null), "occurredOn", "desc"), [], NO_ROWS)
  const [amount, setAmount] = useState("")
  const [payee, setPayee] = useState("")

  async function add() {
    const occurredOn = todayIso()
    const monthKey = monthKeyFor(occurredOn, session?.monthStartDay ?? 1)
    const buckets = await liveBucketsOf(planFor(await livePlans(), monthKey)?.id)
    await createTransaction({
      type: "EXPENSE", occurredOn, monthKey, amount: toMinorUnits(amount, base), currency: base, fxRateMicros: UNIT_RATE_MICROS,
      bucketId: buckets[0]?.id ?? null, category: null, payee: payee || null, note: null, counterpartyType: null, counterpartyId: null,
      attachmentId: null, visibility: "SHARED",
    })
    setAmount("")
    setPayee("")
  }

  const statusText = status.pending > 0 ? t("sync.status.pending", { count: status.pending }) : t(`sync.status.${status.phase}`)
  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.page}
      data={transactions}
      keyExtractor={(row) => row.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text testID="sync-status" onPress={() => void syncNow()}>{statusText}</Text>
          <View style={styles.row}>
            <TextInput testID="new-amount" style={[styles.input, styles.amount]} placeholder={t("transactions.amount")} keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <TextInput testID="new-payee" style={[styles.input, styles.payee]} placeholder={t("transactions.payee")} value={payee} onChangeText={setPayee} />
          </View>
          <Button testID="add-transaction" title={t("transactions.add")} onPress={() => void add()} disabled={!amount} />
          {transactions.length === 0 ? <Text>{t("transactions.none")}</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <View testID={`transaction-${item.id}`} style={styles.item}>
          <Text style={styles.payeeText}>{item.payee ?? "—"}</Text>
          <Text>{formatMoney(item.amount, item.currency, i18n.language)}</Text>
        </View>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <Link href="/diagnostics" testID="open-diagnostics">Diagnostics</Link>
          <Button testID="sign-out" title={t("auth.logout")} onPress={() => void logout()} />
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  page: { padding: 16 },
  header: { gap: 12, marginBottom: 12 },
  row: { flexDirection: "row", gap: 8 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 10, fontSize: 16 },
  amount: { flex: 1 },
  payee: { flex: 2 },
  item: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  payeeText: { fontWeight: "500" },
  footer: { gap: 16, marginTop: 24, alignItems: "flex-start" },
})
