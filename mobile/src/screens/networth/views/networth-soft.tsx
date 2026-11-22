import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { LineChart } from "@/components/charts/line-chart"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Badge, Bar, Card, HeroAmount, Section, Stat, Stats } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, type, useColors } from "@/theme"
import type { NetWorthScreenModel } from "../use-networth-screen"

/** Soft: the figure in a hero card over assets and debts tiles, then what it is made of as bars, the trend and the months. */
export function NetWorthSoft({ model }: { model: NetWorthScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const colors = useColors()
  return (
    <>
      {model.message ? <Notice>{model.message}</Notice> : null}
      <Card>
        <ThemedText variant="headline">{t("networth.headline")}</ThemedText>
        <HeroAmount testID="networth-value" tone={model.negative ? "danger" : undefined}>{model.netWorth}</HeroAmount>
        {model.inUsd ? <ThemedText variant="subhead">{model.inUsd}</ThemedText> : null}
        <ThemedText variant="caption">{t("networth.formula")}</ThemedText>
        {model.household ? <ThemedText variant="subhead">{model.household}</ThemedText> : null}
      </Card>
      <Stats>
        <Stat label={t("networth.assets")} value={model.assets} />
        <Stat label={t("networth.liabilities")} value={model.liabilities} />
      </Stats>

      <Section title={t("networth.assets")} note={model.liquidLine}>
        <Card style={styles.shares}>
          {model.composition.map((share) => (
            <View key={share.key} style={styles.share}>
              <View style={styles.inline}>
                <ThemedText variant="subhead" style={styles.name} numberOfLines={1}>{share.label}</ThemedText>
                <ThemedText variant="caption">{`${share.percent}%`}</ThemedText>
                <ThemedText style={type.amount}>{share.amount}</ThemedText>
              </View>
              <Bar percent={share.percent} />
            </View>
          ))}
        </Card>
        <ThemedText variant="caption">{model.ratesNote}</ThemedText>
      </Section>

      {model.attribution ? (
        <Section title={model.attribution.title} note={t("networth.attributionBody")}>
          <Group>
            {model.attribution.rows.map((row, index, rows) => (
              <Row key={row.key} last={index === rows.length - 1} trailing={<ThemedText style={[type.amount, row.total ? styles.strong : null, row.negative ? styles.negative : null]}>{row.value}</ThemedText>}>
                <ThemedText variant={row.total ? "headline" : "body"}>{row.label}</ThemedText>
              </Row>
            ))}
          </Group>
        </Section>
      ) : null}

      <Section title={t("networth.trend")} note={t("networth.trendBody")}>
        <LineChart testID="networth-trend" labels={model.trend.labels} series={[{ key: "netWorth", label: t("networth.title"), colour: colors.primary, values: model.trend.values }]} />
      </Section>

      <Section title={t("networth.months")} note={t("networth.monthsBody")}>
        <Group>
          {model.months.map((month, index) => (
            <Row
              key={month.key}
              testID={`month-${month.key}`}
              last={index === model.months.length - 1}
              trailing={
                <Button
                  testID={`${month.closed ? "reopen" : "close"}-${month.key}`}
                  variant={month.closed ? "secondary" : "primary"}
                  title={month.closed ? t("networth.reopen") : t("networth.close")}
                  loading={month.busy}
                  disabled={month.disabled}
                  onPress={month.toggle}
                />
              }
            >
              <View style={styles.month}>
                <ThemedText>{month.label}</ThemedText>
                {month.closed ? <Badge tone="ok">{t("networth.closedBadge")}</Badge> : null}
              </View>
              {month.snapshot ? <ThemedText variant="caption">{month.snapshot}</ThemedText> : null}
            </Row>
          ))}
        </Group>
        {model.offline ? <ThemedText variant="caption">{t("networth.needsOnline")}</ThemedText> : null}
      </Section>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  shares: { gap: spacing.md },
  share: { gap: spacing.xs + 2 },
  inline: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  name: { flex: 1, color: colors.label },
  month: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.sm },
  strong: { fontWeight: "600" },
  negative: { color: colors.destructive },
}))
