import { router, Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { addValuation, sellAsset } from "@mizan/core/db/assets"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { toMinorUnits } from "@mizan/core/domain/money/format"
import { table } from "@mizan/core/store/store"
import { Button } from "@/components/button"
import { DateField } from "@/components/date-field"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery } from "@/hooks/use-core"

export type AssetAction = "value" | "sell"

/** A new valuation resets the baseline that depreciation runs from; a sale moves the asset out of net worth. */
export function AssetActionSheet({ id, kind }: { id: string; kind: AssetAction }) {
  const { t } = useTranslation()
  const asset = useLiveQuery(() => table("assets").get(id), [id], undefined)
  const [amount, setAmount] = useState("")
  const [on, setOn] = useState(todayIso())
  const [note, setNote] = useState("")
  const selling = kind === "sell"

  async function save() {
    if (!asset) return
    const value = toMinorUnits(amount, asset.currency)
    if (selling) await sellAsset(asset.id, on, value)
    else await addValuation(asset, on, value, note.trim() || null)
    router.back()
  }

  const verb = t(selling ? "assets.sell" : "assets.addValuation")
  return (
    <Screen sheet>
      <Stack.Screen options={{ title: asset ? `${verb}: ${asset.name}` : verb, headerRight: () => <Button testID="save-asset-action" variant="ghost" title={t("accounts.save")} disabled={!amount} onPress={() => void save()} /> }} />
      <TextField testID="asset-action-amount" label={selling ? t("assets.salePrice") : t("assets.value")} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} autoFocus />
      <DateField label={t("transactions.date")} value={on} onChange={(iso) => iso && setOn(iso)} />
      {selling ? <ThemedText variant="caption">{t("assets.sellHint")}</ThemedText> : <TextField label={t("transactions.note")} maxLength={120} value={note} onChangeText={setNote} />}
    </Screen>
  )
}
