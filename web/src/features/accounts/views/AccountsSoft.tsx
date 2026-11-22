import { ArrowLeftRight, Banknote, House, Landmark, Plus, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import type { CashAccountKind } from "@/db/schema"
import { Lead, PageTop, Pill, ShareBar, amountHero, card, eyebrow, heroCard, meta } from "@/features/networth/views/parts"
import { fillAt } from "@/features/networth/views/shared"
import type { AccountsPageModel } from "../useAccountsPage"

const ICONS: Record<CashAccountKind, typeof Wallet> = { WALLET: Wallet, BANK: Landmark, CASH_AT_HOME: House, OTHER: Banknote }

/** Soft: all cash as one hero figure split by account, then a card per account, two across. */
export default function AccountsSoft({ model }: { model: AccountsPageModel }) {
  const { t } = useTranslation()
  const { rows } = model
  return (
    <div className="flex flex-col gap-4">
      <PageTop title={t("accounts.title")}>
        {model.canTransfer && <Button variant="secondary" onClick={() => model.setTransferring(true)}><ArrowLeftRight /> {t("cashMovements.transfer")}</Button>}
        <Button onClick={() => model.setEditing("new")}><Plus /> {t("accounts.add")}</Button>
      </PageTop>

      {rows.length === 0 && <p className="text-muted-foreground">{t("home.noAccounts")}</p>}

      {rows.length > 0 && (
        <section className={heroCard}>
          <div className="flex items-center justify-between gap-2">
            <h2 className={eyebrow}>{t("home.cashTotal")}</h2>
            <span className={meta}>{t("accounts.count", { count: rows.length })}</span>
          </div>
          <span className={amountHero}>{model.total}</span>
          <ShareBar shares={rows.map((r, index) => ({ key: r.account.id, label: r.account.name, percent: r.percent, fill: fillAt(index) }))} />
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ account, balance, movedSince }, index) => (
          <button key={account.id} type="button" className={`${card} flex-row items-start gap-3.5 text-start`} onClick={() => model.setEditing(account)}>
            <Lead icon={ICONS[account.kind]} className={`size-11 text-background ${fillAt(index)}`} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-baseline justify-between gap-2.5">
                <span className="truncate font-semibold">{account.name}</span>
                <span className="shrink-0 text-lg font-semibold tabular-nums">{balance}</span>
              </span>
              <span className={`${meta} flex flex-wrap items-center gap-2`}>
                {t(`accounts.kinds.${account.kind}`)}{account.institution ? ` · ${account.institution}` : ""} · {account.currency}
                {account.visibility === "PRIVATE" && <Pill>{t("accounts.private")}</Pill>}
              </span>
              {movedSince && <span className={`${meta} tabular-nums`}>{movedSince}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
