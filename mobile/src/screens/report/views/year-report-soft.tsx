import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { StackedBarChart } from "@/components/charts/bar-chart"
import { Group, Row } from "@/components/row"
import { Card, HeroAmount, Line, Section, Stat, Stats } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, useColors } from "@/theme"
import type { YearReportModel } from "../use-year-report-screen"

/** Soft: what the year saved as the hero, received and spent as tiles, then buckets by month, the months and the top categories. */
export function YearReportSoft({ model: m }: { model: YearReportModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const colors = useColors()
  const { summary } = m
  return (
    <>
      <View style={styles.years}>
        <Button testID="previous-year" variant="secondary" title={String(m.year - 1)} onPress={() => m.setYear(m.year - 1)} />
        <Button testID="next-year" variant="secondary" title={String(m.year + 1)} onPress={() => m.setYear(m.year + 1)} />
        <Button testID="year-pdf" variant="secondary" title={t("report.savePdf")} disabled={!summary} onPress={m.savePdf} />
      </View>
      {summary ? (
        <>
          <Card>
            <ThemedText variant="headline">{t("report.summary")}</ThemedText>
            <ThemedText variant="caption">{t("report.saved")}</ThemedText>
            <HeroAmount testID="year-saved" tone={summary.saved < 0 ? "danger" : "ok"}>{m.money(summary.saved)}</HeroAmount>
            {summary.savingRate !== null ? <ThemedText variant="caption">{t("report.savingRate", { rate: summary.savingRate })}</ThemedText> : null}
            <Line label={t("report.trailing")} value={m.trailing === null ? t("report.noProjection") : `${m.trailing}%`} />
            <Line label={t("report.netWorthChange")} value={m.hasNetWorth ? m.money(summary.netWorthEnd! - summary.netWorthStart!) : t("report.noSnapshots")} strong />
            {m.hasNetWorth ? <ThemedText variant="caption">{`${m.money(summary.netWorthStart!)} → ${m.money(summary.netWorthEnd!)}`}</ThemedText> : null}
            <ThemedText variant="caption">{t("report.savingRateDefinition")}</ThemedText>
          </Card>
          <Stats>
            <Stat label={t("income.received")} value={m.money(summary.received)} />
            <Stat label={t("plan.spent")} value={m.money(summary.spent)} />
          </Stats>

          {m.bucketIds.length > 0 ? (
            <Section title={t("report.spendingByBucket")}>
              <Card>
                <StackedBarChart
                  testID="year-by-bucket"
                  labels={summary.months.map((month) => m.monthShort(month.key))}
                  stacks={m.bucketIds.map((id, i) => ({ key: id, label: m.bucketName(id), colour: colors.chart[i % colors.chart.length], values: summary.months.map((month) => month.byBucket[id] ?? 0) }))}
                />
              </Card>
              <Group>
                {m.bucketIds.map((id, index) => (
                  <Row key={id} last={index === m.bucketIds.length - 1} trailing={<ThemedText>{m.money(m.bucketTotal(id))}</ThemedText>}><ThemedText>{m.bucketName(id)}</ThemedText></Row>
                ))}
              </Group>
            </Section>
          ) : null}

          <Section title={t("report.months")}>
            <Group>
              {summary.months.map((month, index) => (
                <Row key={month.key} last={index === summary.months.length - 1} trailing={<ThemedText variant={month.key === m.thisMonth ? "headline" : "body"} style={month.saved < 0 ? styles.negative : null}>{m.money(month.saved)}</ThemedText>}>
                  <ThemedText variant={month.key === m.thisMonth ? "headline" : "body"}>{m.monthLabel(month.key)}</ThemedText>
                  <ThemedText variant="caption">
                    {`${t("income.received")} ${m.money(month.received)} · ${t("plan.spent")} ${m.money(month.spent)} · ${month.savingRate === null ? "—" : `${month.savingRate}%`}`}
                  </ThemedText>
                </Row>
              ))}
            </Group>
          </Section>

          <Section title={t("report.topCategories")}>
            <Group>
              {m.categories.length === 0 ? <Row last><ThemedText variant="subhead">{t("transactions.none")}</ThemedText></Row> : null}
              {m.categories.map(([name, amount], index) => (
                <Row key={name} last={index === m.categories.length - 1} trailing={<ThemedText>{m.money(amount)}</ThemedText>}><ThemedText>{name}</ThemedText></Row>
              ))}
            </Group>
          </Section>
        </>
      ) : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  years: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  negative: { color: colors.destructive },
}))
