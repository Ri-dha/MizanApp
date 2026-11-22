import { Pencil, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AccountPicker } from "@/features/accounts/AccountPicker"
import { Progress, amountHero, eyebrow, meta, row } from "@/features/networth/views/parts"
import type { DebtDetailModel } from "../useDebtDetail"

/** Soft: the outstanding figure with how much is paid off, a flat card to record a payment, the what-if as a banner, then the payments as rows. */
export default function DebtDetailSoft({ model }: { model: DebtDetailModel }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
      <div className="flex flex-col gap-1">
        <span className={meta}>{t("debts.balance")}</span>
        <span className={`${amountHero} ${model.owing && model.active ? "text-destructive" : ""}`}>{model.balance}</span>
        <span className={meta}>{model.summary}</span>
      </div>
      {model.paidLine && (
        <>
          <Progress percent={model.paidPercent} />
          <span className={`${meta} tabular-nums`}>{model.paidLine}</span>
        </>
      )}

      {model.active && (
        <form onSubmit={model.submit} className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <h3 className={eyebrow}>{t("debts.recordPayment")}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <Field id="amount" label={t("income.amount")}>
              <Input id="amount" inputMode="decimal" dir="ltr" placeholder={model.amountPlaceholder} value={model.amount} onChange={(e) => model.setAmount(e.target.value)} />
            </Field>
            <Field id="paidOn" label={t("bills.paidOnLabel")}>
              <Input id="paidOn" type="date" dir="ltr" value={model.paidOn} onChange={(e) => model.setPaidOn(e.target.value)} required />
            </Field>
          </div>
          <AccountPicker id="paymentAccount" label={model.owing ? t("cashMovements.paidFrom") : t("debts.repaidInto")} value={model.accountId} onChange={model.setAccountId} accounts={model.accounts} />
          <Button type="submit" className="self-start">{t("debts.recordPayment")}</Button>
        </form>
      )}

      {model.canAskWhatIf && (
        <div className="flex flex-col gap-2 rounded-xl bg-info-soft p-4">
          <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 shrink-0" />{t("debts.whatIf")}</p>
          <Field id="extra" label={t("debts.extraPerMonth")}>
            <Input id="extra" inputMode="decimal" dir="ltr" className="bg-card" value={model.extra} onChange={(e) => model.setExtra(e.target.value)} />
          </Field>
          {model.whatIf && <p className="text-sm">{model.whatIf}</p>}
        </div>
      )}

      <div>
        <h3 className={`${eyebrow} mb-1`}>{t("debts.ledger")}</h3>
        {model.ledger.length === 0 && <p className="text-sm text-muted-foreground">{t("debts.noPayments")}</p>}
        {model.ledger.map((entry) => (
          <div key={entry.payment.id} className={row}>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium tabular-nums">{entry.amount}</span>
              <span className="text-xs text-muted-foreground">{entry.line}</span>
            </span>
            <Button size="sm" variant="ghost" className="text-link" onClick={() => model.undo(entry.payment)}>{t("bills.undo")}</Button>
          </div>
        ))}
      </div>

      <div className="mt-auto flex border-t border-border pt-4">
        <Button variant="secondary" onClick={model.edit}><Pencil /> {t("debts.edit")}</Button>
      </div>
    </div>
  )
}
