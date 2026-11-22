import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useSession } from "@/api/auth"
import { formatMoney } from "@/app/money"
import type { CashAccount } from "@/db/schema"
import { useMetals } from "@/features/metals/useMetals"
import { restore, softDelete } from "@mizan/core/db/write"
import { inBase } from "@mizan/core/market/currency"
import { useAccountsWithMovements } from "./useAccountsNow"

export function useAccountsPage() {
  const { t, i18n } = useTranslation()
  const base = useSession()?.baseCurrency ?? "IQD"
  const { prices } = useMetals()
  const { accounts, movements } = useAccountsWithMovements()
  const [editing, setEditing] = useState<CashAccount | null | "new">(null)
  const [transferring, setTransferring] = useState(false)

  async function remove(account: CashAccount) {
    await softDelete("cash_account", account.id)
    setEditing(null)
    toast(t("accounts.deleted"), { action: { label: t("accounts.restore"), onClick: () => void restore("cash_account", account.id) } })
  }

  /** Why the balance differs from the one last set: the linked income and spending recorded since. */
  function movedSince(account: CashAccount): string | null {
    const mine = movements.filter((m) => m.cashAccountId === account.id)
    if (mine.length === 0) return null
    const money = (v: number) => formatMoney(v, account.currency, i18n.language)
    const income = mine.filter((m) => m.amount > 0).reduce((s, m) => s + m.amount, 0)
    const spending = mine.filter((m) => m.amount < 0).reduce((s, m) => s - m.amount, 0)
    const changes = [
      income > 0 ? t("cashMovements.movedIn", { amount: money(income) }) : null,
      spending > 0 ? t("cashMovements.movedOut", { amount: money(spending) }) : null,
    ].filter(Boolean).join(" · ")
    return t("cashMovements.since", { changes })
  }

  const rows = accounts.map((account) => ({
    account,
    balance: formatMoney(account.balance, account.currency, i18n.language),
    // An account with no rate to the base currency is listed but left out of the total, as on Home.
    inBase: inBase(account.balance, account.currency, base, prices.perUsd),
    movedSince: movedSince(account),
  }))
  const total = rows.reduce((sum, r) => sum + (r.inBase ?? 0), 0)

  return {
    rows: rows.map((r) => ({ ...r, percent: total > 0 && r.inBase !== null && r.inBase > 0 ? Math.round((r.inBase / total) * 100) : 0 })),
    total: formatMoney(total, base, i18n.language),
    canTransfer: accounts.length > 1,
    editing, setEditing,
    transferring, setTransferring,
    remove,
  }
}

export type AccountsPageModel = ReturnType<typeof useAccountsPage>
