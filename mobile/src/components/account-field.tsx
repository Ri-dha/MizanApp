import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { NO_ACCOUNT } from "@mizan/core/db/accountChoice"
import type { CashAccount } from "@mizan/core/schema"
import { PickerField } from "./picker-field"

/** ADR cash-1: which cash account a record moves; "No account" leaves balances alone. Hidden without accounts. */
export function AccountField({ label, value, onChange, accounts, testID, withNone = true, hint }: {
  label: string
  value: string
  onChange: (id: string) => void
  accounts: CashAccount[]
  testID?: string
  /** Share rows always name an account, so they leave "No account" out. */
  withNone?: boolean
  hint?: string | null
}) {
  const { t } = useTranslation()
  const sections = useMemo(() => [{
    data: [
      ...(withNone ? [{ code: NO_ACCOUNT, title: t("cashMovements.noAccount") }] : []),
      ...accounts.map((a) => ({ code: a.id, title: a.name, detail: a.currency })),
    ],
  }], [accounts, withNone, t])
  if (accounts.length === 0) return null
  const chosen = accounts.find((a) => a.id === value)
  return (
    <PickerField
      label={label}
      value={chosen ? value : NO_ACCOUNT}
      shown={chosen ? `${chosen.name} (${chosen.currency})` : t("cashMovements.noAccount")}
      sections={sections}
      onChange={onChange}
      testID={testID}
      hint={hint === null ? undefined : hint ?? t("cashMovements.accountHint")}
    />
  )
}
