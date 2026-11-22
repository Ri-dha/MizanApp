import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { Button } from "@/components/button"
import { LineChart } from "@/components/charts/line-chart"
import { CurrencyField } from "@/components/currency-field"
import { Notice } from "@/components/notice"
import { Card, HeroAmount, Section, SectionTitle } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, useColors } from "@/theme"
import type { WorldRatesModel } from "../use-world-rates"

/** Soft: the converter in a card with its answer as the large figure, the chart in the next, then the currencies as rows of one list card. */
export function WorldRatesSoft({ model }: { model: WorldRatesModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const colors = useColors()
  if (model.none) {
    return (
      <Section title={t("worldRates.title")}>
        <Card><ThemedText variant="subhead">{t("worldRates.none")}</ThemedText></Card>
      </Section>
    )
  }
  return (
    <Section title={t("worldRates.title")} note={model.body}>
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}

      <Card>
        <SectionTitle>{t("worldRates.convert")}</SectionTitle>
        <TextField testID="world-amount" label={t("worldRates.amount")} keyboardType="decimal-pad" value={model.amount} onChangeText={model.setAmount} />
        <View style={styles.pair}>
          <View style={styles.half}><CurrencyField testID="world-from" label={t("worldRates.from")} value={model.fromCode} onChange={model.setFrom} codes={model.codes} /></View>
          <Button testID="world-swap" variant="ghost" title="⇄" accessibilityLabel={t("worldRates.swap")} onPress={model.swap} style={styles.swap} />
          <View style={styles.half}><CurrencyField testID="world-to" label={t("worldRates.to")} value={model.toCode} onChange={model.setTo} codes={model.codes} /></View>
        </View>
        <HeroAmount testID="world-result">{model.result}</HeroAmount>
        {model.asOf ? <ThemedText variant="caption">{model.asOf}</ThemedText> : null}
      </Card>

      {model.chart ? (
        <Card>
          <SectionTitle>{model.chart.title}</SectionTitle>
          {model.chart.waiting ? <ThemedText variant="caption">{model.chart.waiting}</ThemedText> : (
            <LineChart
              testID="world-chart"
              formatY={model.chart.formatY}
              labels={model.chart.labels}
              series={[{ key: "perUsd", label: model.chart.seriesLabel, colour: colors.chart[1], values: model.chart.values }]}
            />
          )}
        </Card>
      ) : null}

      <View style={styles.listHead}>
        <ThemedText variant="subhead">{model.listTitle}</ThemedText>
        <ThemedText variant="caption">{t("worldRates.followHint")}</ThemedText>
      </View>
      <TextField testID="world-search" label={t("worldRates.search")} value={model.query} onChangeText={model.setQuery} autoCorrect={false} autoCapitalize="none" />
      {model.emptyList ? <Card><ThemedText variant="subhead">{model.emptyList}</ThemedText></Card> : (
        <Card flush>
          {model.rows.map((row, index) => (
            <View key={row.code} testID={`world-${row.code}`} style={[styles.row, index === model.rows.length - 1 ? null : styles.divider]}>
              <Pressable
                testID={`world-follow-${row.code}`}
                accessibilityRole="button"
                accessibilityState={{ selected: row.following, disabled: model.saving }}
                accessibilityLabel={row.followLabel}
                disabled={model.saving}
                hitSlop={spacing.sm}
                onPress={row.toggleFollow}
              >
                <ThemedText style={row.following ? styles.star : styles.starOff}>{row.following ? "★" : "☆"}</ThemedText>
              </Pressable>
              <Pressable testID={`world-pick-${row.code}`} accessibilityRole="button" onPress={row.pick} style={styles.name}>
                <ThemedText style={row.charted ? styles.chosen : null}>{row.code}</ThemedText>
                <ThemedText variant="caption" numberOfLines={1}>{row.name}</ThemedText>
              </Pressable>
              <View style={styles.figures}>
                <ThemedText style={styles.figure}>{row.inBase}</ThemedText>
                <ThemedText variant="caption">{row.perDollar}</ThemedText>
              </View>
            </View>
          ))}
        </Card>
      )}
      {model.showAllTitle ? <Button testID="world-show-all" variant="ghost" title={model.showAllTitle} onPress={model.toggleShowAll} style={styles.more} /> : null}
    </Section>
  )
}

const useStyles = makeStyles((colors) => ({
  pair: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  half: { flex: 1 },
  swap: { paddingHorizontal: spacing.sm },
  listHead: { gap: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginStart: spacing.md, paddingEnd: spacing.md, paddingVertical: spacing.sm + 2, minHeight: 48 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.separator },
  star: { fontSize: 18, color: colors.gold },
  starOff: { fontSize: 18, color: colors.tertiaryLabel },
  name: { flex: 1 },
  chosen: { fontWeight: "600", color: colors.link },
  figures: { alignItems: "flex-end" },
  figure: { fontVariant: ["tabular-nums"] },
  more: { alignSelf: "flex-start" },
}))
