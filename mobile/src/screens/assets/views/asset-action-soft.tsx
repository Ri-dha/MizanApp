import { useTranslation } from "react-i18next"

import { DateField } from "@/components/date-field"
import { Banner, Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import type { AssetActionModel } from "../use-asset-action-screen"

/** Soft: the price or value and its date in one card; a sale says what selling does. */
export function AssetActionSoft({ model: m }: { model: AssetActionModel }) {
  const { t } = useTranslation()
  return (
    <>
      <Card>
        <TextField testID="asset-action-amount" label={m.selling ? t("assets.salePrice") : t("assets.value")} keyboardType="decimal-pad" value={m.amount} onChangeText={m.setAmount} autoFocus />
        <DateField label={t("transactions.date")} value={m.on} onChange={(iso) => iso && m.setOn(iso)} />
        {m.selling ? null : <TextField label={t("transactions.note")} maxLength={120} value={m.note} onChangeText={m.setNote} />}
      </Card>
      {m.selling ? <Banner>{t("assets.sellHint")}</Banner> : null}
    </>
  )
}
