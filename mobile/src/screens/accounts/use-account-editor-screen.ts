import { useCashAccounts } from "@/hooks/use-views"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { createCashAccount, hasProvider, liveAdjustmentsOf, updateCashAccount } from "@mizan/core/db/cashAccounts"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { softDelete } from "@mizan/core/db/write"
import { formatMoney, fromMinorUnits, toMinorUnits } from "@/utils/money"
import type { CashAccountKind } from "@mizan/core/schema"
import { useLiveQuery, useSession } from "@/hooks/use-core"

export const KINDS: CashAccountKind[] = ["WALLET", "BANK", "CASH_AT_HOME", "OTHER"]

export function useAccountEditorScreen({ id }: { id?: string }) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  // Today's balance, linked income and spending included, is what the person sees and edits (ADR cash-1).
  const account = useCashAccounts().find((a) => a.id === id)
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
      institution: hasProvider(kind) ? institution.trim() || null : null,
      currency,
      balance: toMinorUnits(balance || "0", currency),
      visibility: isPrivate ? ("PRIVATE" as const) : ("SHARED" as const),
    }
    if (id) await updateCashAccount(id, input, adjustmentNote.trim() || null, account?.balance)
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

  return { id, account, adjustments, name, setName, kind, setKind, institution, setInstitution, currency, setCurrency, balance, setBalance, adjustmentNote, setAdjustmentNote, isPrivate, setIsPrivate, confirmDelete, money: (value: number) => (account ? formatMoney(value, account.currency, i18n.language) : ""), ready: !!name.trim(), save: () => void save() }
}

export type AccountEditorModel = ReturnType<typeof useAccountEditorScreen>
