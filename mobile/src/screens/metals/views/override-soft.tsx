import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Chips } from "@/components/chips"
import { Banner, Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { OverrideScreenModel } from "../use-override-screen"

/** Soft: what the sheet does in a banner, which price in one card and the price itself in the next. */
export function OverrideSoft({ model }: { model: OverrideScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Banner>{t("metals.overrideBody")}</Banner>
      <Card>
        <View style={styles.field}>
          <ThemedText style={styles.label}>{t("metals.priceOf")}</ThemedText>
          <Chips testID="override-instrument" options={model.instrumentOptions} value={model.instrument} onChange={model.setInstrument} />
        </View>
        {model.isRate ? null : (
          <>
            <View style={styles.field}>
              <ThemedText style={styles.label}>{t("metals.purity")}</ThemedText>
              <Chips options={model.purityOptions} value={model.purity} onChange={model.setPurity} />
            </View>
            <View style={styles.field}>
              <ThemedText style={styles.label}>{t("metals.unit")}</ThemedText>
              <Chips options={model.unitOptions} value={model.unit} onChange={model.setUnit} />
            </View>
          </>
        )}
      </Card>
      <Card>
        <TextField testID="override-price" label={model.priceLabel} keyboardType="decimal-pad" value={model.price} onChangeText={model.setPrice} autoFocus />
        {model.perGram ? <ThemedText variant="caption">{model.perGram}</ThemedText> : null}
        <TextField label={t("income.note")} maxLength={120} placeholder={t("metals.overrideNoteHint")} value={model.note} onChangeText={model.setNote} />
      </Card>
      {model.overrideCount ? <ThemedText variant="caption">{model.overrideCount}</ThemedText> : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  field: { gap: spacing.xs },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500", color: colors.secondaryLabel },
}))
