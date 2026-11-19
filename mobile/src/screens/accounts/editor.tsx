import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, View } from "react-native"

import { createCashAccount, liveAdjustmentsOf, updateCashAccount } from "@mizan/core/db/cashAccounts"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { softDelete } from "@mizan/core/db/write"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@mizan/core/domain/money/format"
import type { CashAccountKind } from "@mizan/core/schema"
import { table } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { spacing } from "@/theme"

const KINDS: CashAccountKind[] = ["WALLET", "BANK", "CASH_AT_HOME", "OTHER"]
const CURRENCIES = ["IQD", "USD"]

export function AccountEditor({ id }: { id?: string }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const account = useLiveQuery(() => (id ? table("cashAccounts").get(id) : Promise.resolve(undefined)), [id], undefined)
  const adjustments = useLiveQuery(() => (id ? liveAdjustmentsOf(id) : Promise.resolve([])), [id], [])
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const [name, setName] = useState("")
  const [kind, setKind] = useState<CashAccountKind>("WALLET")
  const [institution, setInstitution] = useState("")
  const [currency, setCurrency] = useState(session?.baseCurrency ?? "IQD")
  const [balance, setBalance] = useState("")
  const [adjustmentNote, setAdjustmentNote] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [loaded, setLoaded] = useState(!id)

  useEffect(() => {
    if (!account || loaded) return
    setName(account.name)
    setKind(account.kind)
    setInstitution(account.institution ?? "")
    setCurrency(account.currency)
    setBalance(fromMinorUnits(account.balance, account.currency))
    setIsPrivate(account.visibility === "PRIVATE")
    setLoaded(true)
  }, [account, loaded])

  useEffect(() => {
    if (!id) setIsPrivate(privacy.accounts === "PRIVATE")
  }, [id, privacy.accounts])

  async function save() {
    const input = {
      name: name.trim(),
      kind,
      institution: institution.trim() || null,
      currency,
      balance: toMinorUnits(balance || "0", currency),
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateCashAccount(id, input, adjustmentNote.trim() || null)
    else await createCashAccount(input)
    router.back()
  }

  function confirmDelete() {
    if (!id) return
    Alert.alert(t("accounts.delete"), name, [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("accounts.delete"), style: "destructive", onPress: () => void softDelete("cash_account", id).then(() => router.back()) },
    ])
  }

  return (
    <Screen sheet>
      <Stack.Screen options={{ title: id ? t("accounts.edit") : t("accounts.add"), headerRight: () => <Button testID="save-account" variant="ghost" title={t("accounts.save")} disabled={!name.trim()} onPress={() => void save()} /> }} />
      <TextField testID="account-name" label={t("accounts.name")} maxLength={80} value={name} onChangeText={setName} autoFocus={!id} />
      <View style={styles.field}>
        <ThemedText variant="subhead">{t("accounts.kind")}</ThemedText>
        <Chips testID="account-kind" options={KINDS.map((k) => ({ value: k, label: t(`accounts.kinds.${k}`) }))} value={kind} onChange={(next) => next && setKind(next as CashAccountKind)} />
      </View>
      <TextField testID="account-institution" label={t("accounts.institution")} maxLength={80} value={institution} onChangeText={setInstitution} />
      <View style={styles.pair}>
        <View style={styles.wide}><TextField testID="account-balance" label={t("accounts.balance")} keyboardType="decimal-pad" value={balance} onChangeText={setBalance} /></View>
        <View style={styles.narrow}>
          <ThemedText variant="subhead">{t("accounts.currency")}</ThemedText>
          <SegmentedControl values={CURRENCIES} selectedIndex={Math.max(0, CURRENCIES.indexOf(currency))} onChange={(event) => setCurrency(CURRENCIES[event.nativeEvent.selectedSegmentIndex])} />
        </View>
      </View>
      {id ? <TextField testID="account-adjustment-note" label={t("accounts.adjustmentNote")} maxLength={120} value={adjustmentNote} onChangeText={setAdjustmentNote} /> : null}
      <ToggleRow label={t("accounts.private")} value={isPrivate} onChange={setIsPrivate} />
      {account && adjustments.length > 0 ? (
        <View style={styles.field}>
          <ThemedText variant="headline">{t("accounts.adjustments")}</ThemedText>
          <Group>
            {adjustments.map((a, index) => (
              <Row key={a.id} last={index === adjustments.length - 1}>
                <ThemedText variant="subhead">
                  {t("accounts.adjustmentLine", { date: a.adjustedOn, from: formatMoney(a.previousBalance, account.currency, i18n.language), to: formatMoney(a.newBalance, account.currency, i18n.language) })}
                  {a.note ? ` · ${a.note}` : ""}
                </ThemedText>
              </Row>
            ))}
          </Group>
        </View>
      ) : null}
      {id ? <Button testID="delete-account" variant="destructive" title={t("accounts.delete")} onPress={confirmDelete} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  field: { gap: spacing.xs },
})
