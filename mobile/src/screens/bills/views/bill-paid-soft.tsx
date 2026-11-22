import { useTranslation } from "react-i18next"

import { AccountField } from "@/components/account-field"
import { DateField } from "@/components/date-field"
import { Banner, Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import type { BillPaidModel } from "../use-bill-paid-screen"

/** Soft: what was paid, when and from where in one card; an estimated bill says what was expected. */
export function BillPaidSoft({ model: m }: { model: BillPaidModel }) {
  const { t } = useTranslation()
  return (
    <>
      <Card>
        <TextField testID="bill-actual" label={t("bills.actualAmount")} keyboardType="decimal-pad" value={m.actual} onChangeText={m.setActual} />
        <DateField label={t("bills.paidOnLabel")} value={m.paidOn} onChange={(iso) => iso && m.setPaidOn(iso)} />
        <AccountField testID="bill-paid-from" label={t("cashMovements.paidFrom")} value={m.paidFrom} onChange={m.setPaidFrom} accounts={m.accounts} />
      </Card>
      {m.estimate ? <Banner>{t("bills.estimateHint", { amount: m.estimate })}</Banner> : null}
    </>
  )
}
