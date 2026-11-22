import { router } from "expo-router"
import { useTranslation } from "react-i18next"

import type { CashAccount } from "@mizan/core/schema"
import { useCashAccountsWithMovements } from "@/hooks/use-views"
import { formatMoney } from "@/utils/money"

/** Everything the Cash screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useAccountsScreen() {
  const { t, i18n } = useTranslation()
  const { accounts, movements } = useCashAccountsWithMovements()

  /** Why the balance differs from the one last set: the linked income and spending recorded since. */
  function movedSince(account: CashAccount) {
    const mine = movements.filter((m) => m.cashAccountId === account.id)
    if (mine.length === 0) return null
    const money = (v: number) => formatMoney(v, account.currency, i18n.language)
    const income = mine.filter((m) => m.amount > 0).reduce((sum, m) => sum + m.amount, 0)
    const spending = mine.filter((m) => m.amount < 0).reduce((sum, m) => sum - m.amount, 0)
    const changes = [
      income > 0 ? t("cashMovements.movedIn", { amount: money(income) }) : null,
      spending > 0 ? t("cashMovements.movedOut", { amount: money(spending) }) : null,
    ].filter(Boolean).join(" · ")
    return t("cashMovements.since", { changes })
  }

  const rows = accounts.map((account) => ({
    id: account.id,
    kind: account.kind,
    name: account.name,
    detail: [t(`accounts.kinds.${account.kind}`), account.institution, account.visibility === "PRIVATE" ? t("accounts.private") : null].filter(Boolean).join(" · "),
    balance: formatMoney(account.balance, account.currency, i18n.language),
    moved: movedSince(account),
    href: { pathname: "/account-edit" as const, params: { id: account.id } },
  }))
  const kinds = [...new Set(accounts.map((a) => a.kind))]
  // A total only means something when every account is in one currency; mixed currencies show no headline.
  const currency = accounts.length > 0 && accounts.every((a) => a.currency === accounts[0].currency) ? accounts[0].currency : null
  const total = accounts.reduce((sum, a) => sum + a.balance, 0)

  return {
    rows,
    groups: kinds.map((kind) => ({ kind, title: t(`accounts.kinds.${kind}`), rows: rows.filter((r) => r.kind === kind) })),
    total: currency ? formatMoney(total, currency, i18n.language) : null,
    shares: currency && total > 0
      ? kinds.map((kind) => ({ kind, label: t(`accounts.kinds.${kind}`), percent: Math.round((accounts.filter((a) => a.kind === kind).reduce((s, a) => s + Math.max(0, a.balance), 0) * 100) / total) }))
      : [],
    canTransfer: accounts.length > 1,
    transfer: () => router.push("/account-transfer"),
    add: () => router.push("/account-edit"),
  }
}

export type AccountsScreenModel = ReturnType<typeof useAccountsScreen>
