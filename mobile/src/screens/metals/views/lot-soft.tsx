import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { CurrencyField } from "@/components/currency-field"
import { DateField } from "@/components/date-field"
import { Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import type { LotScreenModel } from "../use-lot-screen"

/** Soft: what was bought in one card, what it cost in the next, then where it is kept. */
export function LotSoft({ model }: { model: LotScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <SegmentedControl values={model.metalNames} selectedIndex={model.metalIndex} onChange={(event) => model.chooseMetal(event.nativeEvent.selectedSegmentIndex)} />
      <Card>
        <View style={styles.field}>
          <ThemedText style={styles.label}>{t("metals.purity")}</ThemedText>
          <Chips testID="lot-purity" options={model.purityOptions} value={model.purity} onChange={model.setPurity} />
        </View>
        <TextField testID="lot-quantity" label={t("metals.weight")} keyboardType="decimal-pad" value={model.quantity} onChangeText={model.setQuantity} />
        <View style={styles.field}>
          <Chips testID="lot-unit" options={model.unitOptions} value={model.unit} onChange={model.setUnit} />
          <ThemedText variant="caption">{model.inGrams}</ThemedText>
        </View>
        <View style={styles.field}>
          <ThemedText style={styles.label}>{t("metals.form")}</ThemedText>
          <Chips testID="lot-form" options={model.formOptions} value={model.form} onChange={model.setForm} />
        </View>
      </Card>

      <Card>
        <DateField label={t("metals.purchaseDate")} value={model.purchaseDate} onChange={model.setPurchaseDate} />
        <View style={styles.pair}>
          <View style={styles.wide}>
            <TextField testID="lot-cost" label={t("metals.metalCost")} keyboardType="decimal-pad" value={model.metalCost} onChangeText={model.setMetalCost} />
          </View>
          <View style={styles.narrow}>
            <CurrencyField testID="lot-currency" value={model.currency} onChange={model.pickCurrency} />
          </View>
        </View>
        {model.todayHint ? <ThemedText variant="caption">{model.todayHint}</ThemedText> : null}
        {model.canUseToday ? <Button variant="ghost" title={t("metals.useToday")} style={styles.start} onPress={model.useToday} /> : null}
        {model.rateLabel ? <TextField testID="lot-rate" label={model.rateLabel} keyboardType="decimal-pad" value={model.rate} onChangeText={model.setRate} /> : null}
        <View style={styles.pair}>
          <View style={styles.half}><TextField testID="lot-making" label={t("metals.makingCharge")} keyboardType="decimal-pad" value={model.making} onChangeText={model.setMaking} /></View>
          <View style={styles.half}><TextField testID="lot-fees" label={t("metals.fees")} keyboardType="decimal-pad" value={model.fees} onChangeText={model.setFees} /></View>
        </View>
        <ThemedText variant="caption">{t("metals.makingHint")}</ThemedText>
      </Card>

      <Card>
        <View style={styles.pair}>
          <View style={styles.half}><TextField label={t("metals.dealer")} maxLength={80} value={model.dealer} onChangeText={model.setDealer} /></View>
          <View style={styles.half}><TextField label={t("metals.location")} maxLength={80} value={model.location} onChangeText={model.setLocation} /></View>
        </View>
        <View style={styles.pair}>
          <View style={styles.half}><TextField label={t("metals.serial")} maxLength={80} value={model.serial} onChangeText={model.setSerial} /></View>
          <View style={styles.half}><TextField label={t("metals.heldFor")} maxLength={80} value={model.heldFor} onChangeText={model.setHeldFor} /></View>
        </View>
        <ToggleRow label={t("accounts.private")} value={model.isPrivate} onChange={model.setIsPrivate} />
      </Card>
      {model.editing ? <Button testID="delete-lot" variant="destructive" title={t("accounts.delete")} onPress={model.remove} /> : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  field: { gap: spacing.xs },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500", color: colors.secondaryLabel },
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  wide: { flex: 3 },
  narrow: { flex: 2, gap: spacing.xs },
  half: { flex: 1 },
  start: { alignSelf: "flex-start" },
}))
