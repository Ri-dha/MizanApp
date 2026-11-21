import { Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { formatMoney } from "@/app/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { unassigned } from "@mizan/core/db/cashMovements"
import type { CashAccount } from "@mizan/core/schema"
import { sharesFrom, type ShareRow } from "./shareRows"

/**
 * T-cash-movements: split an income across cash accounts, each by a fixed amount or a percentage.
 * What is left over goes into no account.
 */
export function AccountSharesEditor({ rows, onChange, accounts, amount, currency, label, hint }: {
  rows: ShareRow[]
  onChange: (rows: ShareRow[]) => void
  accounts: CashAccount[]
  amount: number
  currency: string
  label: string
  hint: string
}) {
  const { t, i18n } = useTranslation()
  const left = unassigned(amount, sharesFrom(rows, currency))
  const update = (index: number, patch: Partial<ShareRow>) => onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <Label>{label}</Label>
        <p className="text-xs opacity-70">{t("cashMovements.noAccounts")}</p>
      </div>
    )
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <p className="text-xs opacity-70">{hint}</p>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto_6rem_auto] items-center gap-2">
          <Select value={row.cashAccountId} onValueChange={(id) => update(index, { cashAccountId: id })}>
            <SelectTrigger aria-label={t("cashMovements.account")}><SelectValue placeholder={t("cashMovements.account")} /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>)}
            </SelectContent>
          </Select>
          <ToggleGroup type="single" variant="outline" size="sm" value={row.kind} aria-label={t("cashMovements.howMuch")}
            onValueChange={(kind) => kind && update(index, { kind: kind as ShareRow["kind"], text: "" })}>
            <ToggleGroupItem value="AMOUNT" aria-label={t("cashMovements.fixedAmount")}>{currency}</ToggleGroupItem>
            <ToggleGroupItem value="PERCENT" aria-label={t("cashMovements.percentage")}>%</ToggleGroupItem>
          </ToggleGroup>
          <Input inputMode="decimal" dir="ltr" aria-label={row.kind === "AMOUNT" ? t("cashMovements.fixedAmount") : t("cashMovements.percentage")}
            value={row.text} onChange={(e) => update(index, { text: e.target.value })} />
          <Button type="button" variant="ghost" size="icon" aria-label={t("cashMovements.remove")} onClick={() => onChange(rows.filter((_, i) => i !== index))}>
            <X />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { cashAccountId: accounts[0].id, kind: rows.length === 0 ? "PERCENT" : "AMOUNT", text: rows.length === 0 ? "100" : "" }])}>
          <Plus /> {t("cashMovements.addAccount")}
        </Button>
        {rows.length > 0 && (
          <span className={cn("text-xs", left < 0 ? "text-destructive" : "opacity-70")}>
            {left < 0
              ? t("cashMovements.tooMuch", { amount: formatMoney(-left, currency, i18n.language) })
              : left > 0 ? t("cashMovements.leftOver", { amount: formatMoney(left, currency, i18n.language) }) : t("cashMovements.allAssigned")}
          </span>
        )}
      </div>
    </fieldset>
  )
}
