import { ArrowLeftRight, Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAccountsWithMovements } from "./useAccountsNow"
import type { Movement } from "@mizan/core/db/cashMovements"
import type { CashAccount } from "@/db/schema"
import { restore, softDelete } from "@mizan/core/db/write"
import { formatMoney } from "@/app/money"
import { AccountSheet } from "./AccountSheet"
import { TransferSheet } from "./TransferSheet"

export function AccountsPage() {
  const { t, i18n } = useTranslation()
  const { accounts, movements } = useAccountsWithMovements()
  const [editing, setEditing] = useState<CashAccount | null | "new">(null)
  const [transferring, setTransferring] = useState(false)

  async function remove(account: CashAccount) {
    await softDelete("cash_account", account.id)
    setEditing(null)
    toast(t("accounts.deleted"), { action: { label: t("accounts.restore"), onClick: () => void restore("cash_account", account.id) } })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">{t("accounts.title")}</h1>
        <div className="flex gap-2">
          {accounts.length > 1 && <Button variant="outline" onClick={() => setTransferring(true)}><ArrowLeftRight /> {t("cashMovements.transfer")}</Button>}
          <Button onClick={() => setEditing("new")}><Plus /> {t("accounts.add")}</Button>
        </div>
      </div>

      {accounts.map((account) => (
        <Card key={account.id} className="cursor-pointer" onClick={() => setEditing(account)}>
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex flex-col">
              <span className="font-semibold">{account.name}</span>
              <span className="text-sm opacity-70">
                {t(`accounts.kinds.${account.kind}`)}{account.institution ? ` · ${account.institution}` : ""}
              </span>
              <MovedSince account={account} movements={movements} />
            </div>
            <div className="flex items-center gap-2">
              {account.visibility === "PRIVATE" && <Badge variant="secondary">{t("accounts.private")}</Badge>}
              <span className="text-xl font-semibold tabular-nums">{formatMoney(account.balance, account.currency, i18n.language)}</span>
            </div>
          </CardContent>
        </Card>
      ))}

      {accounts.length === 0 && <p className="opacity-70">{t("home.noAccounts")}</p>}

      <TransferSheet open={transferring} transfer={null} onClose={() => setTransferring(false)} />
      <AccountSheet
        open={editing !== null}
        account={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onDelete={remove}
      />
    </div>
  )
}

/** Why the balance differs from the one last set: the linked income and spending recorded since. */
function MovedSince({ account, movements }: { account: CashAccount; movements: Movement[] }) {
  const { t, i18n } = useTranslation()
  const mine = movements.filter((m) => m.cashAccountId === account.id)
  if (mine.length === 0) return null
  const money = (v: number) => formatMoney(v, account.currency, i18n.language)
  const income = mine.filter((m) => m.amount > 0).reduce((s, m) => s + m.amount, 0)
  const spending = mine.filter((m) => m.amount < 0).reduce((s, m) => s - m.amount, 0)
  const changes = [
    income > 0 ? t("cashMovements.movedIn", { amount: money(income) }) : null,
    spending > 0 ? t("cashMovements.movedOut", { amount: money(spending) }) : null,
  ].filter(Boolean).join(" · ")
  return <span className="text-xs opacity-70">{t("cashMovements.since", { changes })}</span>
}

