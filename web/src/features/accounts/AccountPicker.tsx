import { useTranslation } from "react-i18next"

import { Field } from "@/components/Field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CashAccount } from "@mizan/core/schema"
import { NO_ACCOUNT } from "./lastAccount"

/** ADR cash-1: which cash account a record moves; "No account" leaves balances alone. Hidden without accounts. */
export function AccountPicker({ id, label, value, onChange, accounts }: {
  id: string
  label: string
  value: string
  onChange: (id: string) => void
  accounts: CashAccount[]
}) {
  const { t } = useTranslation()
  if (accounts.length === 0) return null
  return (
    <Field id={id} label={label} hint={t("cashMovements.accountHint")}>
      <Select value={accounts.some((a) => a.id === value) ? value : NO_ACCOUNT} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_ACCOUNT}>{t("cashMovements.noAccount")}</SelectItem>
          {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.currency})</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  )
}
