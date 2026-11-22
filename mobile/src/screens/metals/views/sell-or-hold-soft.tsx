import { useTranslation } from "react-i18next"

import { LineChart } from "@/components/charts/line-chart"
import { Chips } from "@/components/chips"
import { Card, HeroAmount, Section } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { useColors } from "@/theme"
import type { SellOrHoldModel } from "../use-sell-or-hold"

/** Soft: the answer as the card's one large figure, with the chart of how it moved under it. */
export function SellOrHoldSoft({ model }: { model: SellOrHoldModel }) {
  const { t } = useTranslation()
  const colors = useColors()
  return (
    <Section title={t("metals.sellOrHold")} note={t("metals.sellOrHoldBody")}>
      <Card>
        <Chips testID="sell-or-hold-metal" options={model.metalOptions} value={model.metal} onChange={model.setMetal} />
        {model.empty ? <ThemedText variant="subhead">{model.empty}</ThemedText> : (
          <>
            <ThemedText variant="subhead">{model.verdict.title}</ThemedText>
            <HeroAmount testID="sell-verdict" tone={model.verdict.negative ? "danger" : "ok"}>{model.verdict.figure}</HeroAmount>
            <ThemedText variant="caption">{model.verdict.line}</ThemedText>
          </>
        )}
        {model.breakEven ? <ThemedText variant="caption">{model.breakEven}</ThemedText> : null}
        {model.chart ? (
          <LineChart
            testID="sell-or-hold-chart"
            labels={model.chart.labels}
            series={[
              { key: "cost", label: t("metals.seriesNames.cost"), colour: colors.chart[4], values: model.chart.cost, dashed: true, step: true },
              { key: "valueAsk", label: t("metals.seriesNames.valueAsk"), colour: colors.primary, values: model.chart.valueAsk },
              { key: "valueBid", label: t("metals.seriesNames.valueBid"), colour: colors.chart[3], values: model.chart.valueBid },
            ]}
          />
        ) : model.grows ? <ThemedText variant="caption">{t("metals.seriesGrows")}</ThemedText> : null}
      </Card>
    </Section>
  )
}
