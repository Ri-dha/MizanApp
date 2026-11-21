import { router, Stack } from "expo-router"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { createAccountTransfer, updateAccountTransfer } from "@mizan/core/db/cashMovements"
import { deleteTransaction } from "@mizan/core/db/transactions"
import { monthKeyFor, todayIso } from "@mizan/core/domain/calendar/month"
import { inBase, marketFxRateMicros } from "@mizan/core/market/currency"
import { table } from "@mizan/core/store/store"
import { AccountField } from "@/components/account-field"
import { Button } from "@/components/button"
import { DateField } from "@/components/date-field"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useCashAccounts, useMetals } from "@/hooks/use-views"
import { fromMinorUnits, toMinorUnits } from "@/utils/money"

const SAME_RATE = 1_000_000

/**
 * T-cash-movements: money moved between two of the person's own accounts. Between currencies the
 * amount received is asked for, since an exchange office's rate is not the market's.
 */
export function AccountTransferEditor({ id }: { id?: string }) {
  const { t } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const accounts = useCashAccounts()
  const { prices } = useMetals()
  const transfer = useLiveQuery(() => (id ? table("transactions").get(id) : Promise.resolve(undefined)), [id], undefined)
  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")
  const [amount, setAmount] = useState("")
  const [received, setReceived] = useState("")
  const [receivedTyped, setReceivedTyped] = useState(false)
  const [occurredOn, setOccurredOn] = useState(todayIso())
  const [note, setNote] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded || (id && !transfer) || accounts.length === 0) return
    setFromId(transfer?.cashAccountId ?? accounts[0]?.id ?? "")
    setToId(transfer?.counterpartyId ?? accounts[1]?.id ?? "")
    setAmount(transfer ? fromMinorUnits(transfer.amount, transfer.currency) : "")
    setReceivedTyped(!!transfer?.counterAmount)
    setOccurredOn(transfer?.occurredOn ?? todayIso())
    setNote(transfer?.note ?? "")
    setLoaded(true)
  }, [loaded, id, transfer, accounts])

  const from = accounts.find((a) => a.id === fromId)
  const to = accounts.find((a) => a.id === toId)
  const exchange = !!from && !!to && from.currency !== to.currency
  const sent = from ? toMinorUnits(amount || "0", from.currency) : 0
  const atToday = from && to ? inBase(sent, from.currency, to.currency, prices.perUsd) : null

  useEffect(() => {
    if (!to || receivedTyped) return
    if (transfer?.counterAmount && transfer.counterpartyId === to.id) setReceived(fromMinorUnits(transfer.counterAmount, to.currency))
    else setReceived(atToday === null ? "" : fromMinorUnits(atToday, to.currency))
  }, [to, atToday, receivedTyped, transfer])

  const fromChoices = useMemo(() => accounts.filter((a) => a.id !== toId), [accounts, toId])
  const toChoices = useMemo(() => accounts.filter((a) => a.id !== fromId), [accounts, fromId])
  const valid = !!from && !!to && from.id !== to.id && sent > 0 && (!exchange || toMinorUnits(received || "0", to.currency) > 0)

  async function save() {
    if (!valid || !from || !to) return
    const input = {
      from, to, amount: sent,
      counterAmount: exchange ? toMinorUnits(received, to.currency) : sent,
      occurredOn, monthKey: monthKeyFor(occurredOn, startDay),
      fxRateMicros: marketFxRateMicros(from.currency, base, prices.perUsd) || SAME_RATE,
      note: note.trim() || null,
    }
    if (transfer) await updateAccountTransfer(transfer, input)
    else await createAccountTransfer(input)
    router.back()
  }

  async function remove() {
    if (transfer) await deleteTransaction(transfer.id)
    router.back()
  }

  const title = id ? t("cashMovements.editTransfer") : t("cashMovements.transfer")
  if (accounts.length < 2) {
    return (
      <Screen sheet>
        <Stack.Screen options={{ title }} />
        <ThemedText variant="subhead">{t("cashMovements.needTwoAccounts")}</ThemedText>
      </Screen>
    )
  }
  return (
    <Screen sheet>
      <Stack.Screen options={{ title, headerRight: () => <Button testID="save-transfer" variant="ghost" title={t("accounts.save")} disabled={!valid} onPress={() => void save()} /> }} />
      <AccountField testID="transfer-from" label={t("cashMovements.from")} value={fromId} onChange={setFromId} accounts={fromChoices} withNone={false} hint={null} />
      <AccountField testID="transfer-to" label={t("cashMovements.to")} value={toId} onChange={setToId} accounts={toChoices} withNone={false} hint={null} />
      <TextField testID="transfer-amount" label={t("cashMovements.amountSent", { currency: from?.currency ?? "" })} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} autoFocus={!id} />
      {exchange ? (
        <>
          <TextField testID="transfer-received" label={t("cashMovements.amountReceived", { currency: to?.currency ?? "" })} keyboardType="decimal-pad" value={received}
            onChangeText={(value) => { setReceivedTyped(true); setReceived(value) }} />
          <ThemedText variant="caption">{t("cashMovements.receivedHint")}</ThemedText>
        </>
      ) : null}
      <DateField label={t("transactions.date")} value={occurredOn} onChange={(iso) => iso && setOccurredOn(iso)} />
      <TextField testID="transfer-note" label={t("income.note")} maxLength={120} value={note} onChangeText={setNote} />
      <ThemedText variant="caption">{t("cashMovements.transferHint")}</ThemedText>
      {id ? <Button testID="delete-transfer" variant="destructive" title={t("accounts.delete")} onPress={() => void remove()} /> : null}
    </Screen>
  )
}
