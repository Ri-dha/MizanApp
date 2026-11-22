import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Chips } from "@/components/chips"
import { DateField } from "@/components/date-field"
import { Notice } from "@/components/notice"
import { Card, SectionTitle } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import type { SellScreenModel } from "../use-sell-screen"

/** Soft: how much leaves and for what, then which purchases it comes from, and the gain it would realise in a card of its own. */
export function SellSoft({ model }: { model: SellScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
      <Card>
        <TextField testID="sell-quantity" label={t("metals.weight")} keyboardType="decimal-pad" value={model.quantity} onChangeText={model.setQuantity} />
        <Chips testID="sell-unit" options={model.unitOptions} value={model.unit} onChange={model.setUnit} />
        <View style={styles.pair}>
          <View style={styles.half}><TextField testID="sell-proceeds" label={t("metals.proceeds")} keyboardType="decimal-pad" value={model.proceeds} onChangeText={model.setProceeds} /></View>
          <View style={styles.half}><TextField testID="sell-fees" label={t("metals.fees")} keyboardType="decimal-pad" value={model.fees} onChangeText={model.setFees} /></View>
        </View>
        <DateField label={t("transactions.date")} value={model.soldOn} onChange={model.setSoldOn} />
        <TextField label={t("metals.buyer")} maxLength={80} value={model.buyer} onChangeText={model.setBuyer} />
      </Card>

      <Card>
        <SectionTitle>{t("metals.method")}</SectionTitle>
        <Chips testID="sell-method" options={model.methodOptions} value={model.method} onChange={model.setMethod} />
        <ThemedText variant="caption">{t("metals.methodHint")}</ThemedText>
        {model.lots ? (
          <View style={styles.field}>
            <ThemedText style={styles.label}>{t("metals.chooseLots")}</ThemedText>
            {model.lots.map((lot) => <ToggleRow key={lot.id} label={lot.label} value={lot.chosen} onChange={lot.toggle} />)}
          </View>
        ) : null}
      </Card>

      {model.previewError ? <Card><ThemedText>{model.previewError}</ThemedText></Card> : null}
      {model.preview ? (
        <Card>
          <ThemedText variant="subhead">{model.preview.cost}</ThemedText>
          <ThemedText testID="sale-preview" variant="headline" style={model.preview.negative ? styles.negative : styles.positive}>{model.preview.realised}</ThemedText>
          <ThemedText variant="caption">{model.preview.excludingMaking}</ThemedText>
        </Card>
      ) : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  half: { flex: 1 },
  field: { gap: spacing.xs },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500", color: colors.secondaryLabel },
  positive: { color: colors.success },
  negative: { color: colors.destructive },
}))
