import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Chips } from "@/components/chips"
import { Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import type { MarketSettingsModel } from "../use-settings-screen"

/** Soft: one card per decision: which prices, the premium, how sales are costed, and what a dealer would pay. */
export function MarketSettingsSoft({ model }: { model: MarketSettingsModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      {model.dinar ? (
        <Card>
          <View style={styles.field}>
            <ThemedText style={styles.label}>{t("metals.rateKind")}</ThemedText>
            <Chips options={model.rateKindOptions} value={model.rateKind} onChange={model.setRateKind} />
            <ThemedText variant="caption">{t("metals.rateKindHint")}</ThemedText>
          </View>
          <View style={styles.field}>
            <ThemedText style={styles.label}>{t("metals.priceSource")}</ThemedText>
            <Chips options={model.priceSourceOptions} value={model.priceSource} onChange={model.setPriceSource} />
            <ThemedText variant="caption">{t("metals.priceSourceHint")}</ThemedText>
          </View>
        </Card>
      ) : null}

      <Card>
        <View style={styles.pair}>
          {model.metals.map((row) => (
            <View key={row.metal} style={styles.half}>
              <TextField testID={`premium-${row.metal}`} label={row.premiumLabel} keyboardType="decimal-pad" value={row.premium} onChangeText={row.setPremium} />
            </View>
          ))}
        </View>
        <ThemedText variant="caption">{t("metals.premiumHint")}</ThemedText>
      </Card>

      <Card>
        {model.metals.map((row) => (
          <View key={row.metal} style={styles.field}>
            <ThemedText style={styles.label}>{row.methodLabel}</ThemedText>
            <Chips options={row.methodOptions} value={row.method} onChange={row.setMethod} />
          </View>
        ))}
        <ThemedText variant="caption">{t("metals.methodLocked")}</ThemedText>
      </Card>

      <Card>
        <ToggleRow label={t("metals.buybackBasis")} value={model.buybackBasis} onChange={model.setBuybackBasis} />
        <View style={styles.pair}>
          {model.metals.map((row) => (
            <View key={row.metal} style={styles.half}>
              <TextField label={row.buybackLabel} keyboardType="decimal-pad" value={row.buyback} onChangeText={row.setBuyback} />
            </View>
          ))}
        </View>
        <ThemedText variant="caption">{t("metals.buybackHint")}</ThemedText>
      </Card>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  field: { gap: spacing.xs },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "500", color: colors.secondaryLabel },
  pair: { flexDirection: "row", gap: spacing.md, alignItems: "flex-end" },
  half: { flex: 1 },
}))
