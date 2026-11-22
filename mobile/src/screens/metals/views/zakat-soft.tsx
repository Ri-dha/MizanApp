import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { DateField } from "@/components/date-field"
import { Notice } from "@/components/notice"
import { Badge, Banner, Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { ZakatScreenModel } from "../use-zakat-screen"

/** Soft: the disclaimer first, the date, then one card per metal with its inputs above its result. */
export function ZakatSoft({ model }: { model: ZakatScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Banner>{t("zakat.disclaimer")}</Banner>
      <Card>
        <DateField label={t("zakat.asOf")} value={model.asOf} onChange={model.setAsOf} />
        <ThemedText variant="caption">{model.hijri}</ThemedText>
      </Card>
      {model.metals.map((row) => (
        <Card key={row.metal}>
          <View style={styles.head}>
            <ThemedText variant="headline" style={styles.grow}>{row.name}</ThemedText>
            <Badge testID={`zakat-${row.metal}`} tone={row.reaches ? "gold" : "neutral"}>{row.verdict}</Badge>
          </View>
          <View style={styles.pair}>
            <View style={styles.half}>
              <TextField testID={`nisab-${row.metal}`} label={row.nisabLabel} keyboardType="decimal-pad" value={row.nisab} onChangeText={row.setNisab} />
            </View>
            <View style={styles.half}>
              <TextField label={row.priceLabel} keyboardType="decimal-pad" value={row.price} onChangeText={row.setPrice} />
            </View>
          </View>
          <ThemedText variant="caption">{row.priceHint}</ThemedText>
          <View style={styles.result}>
            <ThemedText>{row.pureWeight}</ThemedText>
            <ThemedText>{row.value}</ThemedText>
            {row.base ? <ThemedText variant="headline">{row.base}</ThemedText> : null}
          </View>
        </Card>
      ))}
      <Notice>{t("zakat.footer")}</Notice>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  grow: { flex: 1 },
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  half: { flex: 1 },
  result: { gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.separator },
}))
