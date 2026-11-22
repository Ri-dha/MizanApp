import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { LineChart } from "@/components/charts/line-chart"
import { Chips } from "@/components/chips"
import { Group, Row } from "@/components/row"
import { Badge, Card, HeroAmount, Section, type Tone } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, useColors } from "@/theme"
import type { PricesScreenModel } from "../use-prices-screen"
import { WorldRates } from "../world-rates"

const TONES: Record<"up" | "down" | "flat", Tone> = { up: "ok", down: "danger", flat: "neutral" }

/** Soft: the series chips, then one hero card with the latest price, its move, the range and the chart; changes carry a badge. */
export function PricesSoft({ model }: { model: PricesScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const colors = useColors()
  return (
    <>
      {model.iraqi ? null : <WorldRates />}
      <Chips testID="prices-series" options={model.seriesOptions} value={model.key} onChange={model.setKey} />
      <Card>
        <ThemedText variant="headline">{model.heading}</ThemedText>
        <View style={styles.baseline}>
          <HeroAmount testID="prices-latest">{model.latest}</HeroAmount>
          {model.moved ? <ThemedText variant="subhead" style={[styles.move, model.moved.direction === "up" ? styles.up : model.moved.direction === "down" ? styles.down : null]}>{model.moved.text}</ThemedText> : null}
        </View>
        {model.gap ? <ThemedText variant="caption">{model.gap}</ThemedText> : null}
        {model.updated ? <ThemedText variant="caption">{model.updated}</ThemedText> : null}
        <Chips testID="prices-range" options={model.rangeOptions} value={model.range} onChange={model.setRange} />
        {model.chart ? (
          <LineChart
            testID="prices-chart"
            formatY={model.axisNumber}
            labels={model.chart.labels}
            series={[{ key: model.key, label: model.seriesLabel, colour: colors.primary, values: model.chart.values, step: model.chart.step }]}
          />
        ) : (
          <ThemedText variant="subhead">{model.loading ? t("common.loading") : t("prices.notEnough")}</ThemedText>
        )}
      </Card>
      <Section title={t("prices.changes")} note={t("prices.changesBody")}>
        <Group>
          {model.changes.length === 0 ? <Row last><ThemedText variant="subhead">{t("prices.noChanges")}</ThemedText></Row> : null}
          {model.changes.map((change, index) => (
            <Row key={change.id} last={index === model.changes.length - 1} trailing={<Badge tone={TONES[change.direction]}>{change.delta ?? t("prices.firstPrice")}</Badge>}>
              <ThemedText variant="headline">{change.value}</ThemedText>
              <ThemedText variant="caption">{change.detail}</ThemedText>
            </Row>
          ))}
        </Group>
      </Section>
      {model.iraqi ? <WorldRates /> : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  baseline: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: spacing.sm },
  move: { fontWeight: "600" },
  up: { color: colors.success },
  down: { color: colors.destructive },
}))
