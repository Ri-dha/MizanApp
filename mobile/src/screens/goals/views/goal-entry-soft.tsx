import { useTranslation } from "react-i18next"

import { DateField } from "@/components/date-field"
import { Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import type { GoalEntryModel } from "../use-goal-entry-screen"

/** Soft: how much and when, in one card. */
export function GoalEntrySoft({ model: m }: { model: GoalEntryModel }) {
  const { t } = useTranslation()
  return (
    <Card>
      <TextField testID="goal-entry-amount" label={t("income.amount")} keyboardType="decimal-pad" value={m.amount} onChangeText={m.setAmount} autoFocus />
      <DateField label={t("transactions.date")} value={m.on} onChange={(iso) => iso && m.setOn(iso)} />
    </Card>
  )
}
