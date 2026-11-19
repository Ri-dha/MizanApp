import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { trailingSavingRate, yearSummary, type YearSummary } from "@mizan/core/db/report"
import { formatMoney } from "@/utils/money"
import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey } from "@/hooks/use-views"
import { spacing, useBrandColors } from "@/theme"
import { formatMonthKey } from "@/utils/month"

const TOP_CATEGORIES = 8

/** FR-RPT-03/04/05: the year at a glance, spending per bucket and category, saving rate; the chart comes with step 7. */
export function YearReport() {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const thisMonth = currentMonthKey(startDay)
  const [year, setYear] = useState(Number(thisMonth.slice(0, 4)))
  const uncategorised = t("report.uncategorised")
  const summary = useLiveQuery(() => yearSummary(year, startDay, uncategorised), [year, startDay, uncategorised], undefined as YearSummary | undefined)
  const trailing = useLiveQuery(() => trailingSavingRate(thisMonth, startDay), [thisMonth, startDay], null)
  const money = (v: number) => formatMoney(v, base, i18n.language)
  const negative = (v: number) => (v < 0 ? { color: brand.destructive } : null)
  const categories = summary ? Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).slice(0, TOP_CATEGORIES) : []
  const bucketIds = summary ? [...new Set(summary.months.flatMap((m) => Object.keys(m.byBucket)))] : []
  const bucketName = (id: string) => summary?.months.map((m) => m.bucketNames[id]).find(Boolean) ?? id
  const bucketTotal = (id: string) => summary?.months.reduce((s, m) => s + (m.byBucket[id] ?? 0), 0) ?? 0
  const hasNetWorth = summary?.netWorthStart != null && summary?.netWorthEnd != null

  return (
    <Screen>
      <Stack.Screen options={{ title: t("report.yearTitle", { year }) }} />
      <View style={styles.years}>
        <Button testID="previous-year" variant="secondary" title={String(year - 1)} onPress={() => setYear(year - 1)} />
        <Button testID="next-year" variant="secondary" title={String(year + 1)} onPress={() => setYear(year + 1)} />
      </View>
      {summary ? (
        <>
          <View style={styles.section}>
            <ThemedText variant="headline">{t("report.summary")}</ThemedText>
            <ThemedText variant="caption">{t("report.savingRateDefinition")}</ThemedText>
            <Group>
              <Row trailing={<ThemedText>{money(summary.received)}</ThemedText>}><ThemedText>{t("income.received")}</ThemedText></Row>
              <Row trailing={<ThemedText>{money(summary.spent)}</ThemedText>}><ThemedText>{t("plan.spent")}</ThemedText></Row>
              <Row trailing={<ThemedText testID="year-saved" style={negative(summary.saved)}>{money(summary.saved)}</ThemedText>}>
                <ThemedText>{t("report.saved")}</ThemedText>
                {summary.savingRate !== null ? <ThemedText variant="caption">{t("report.savingRate", { rate: summary.savingRate })}</ThemedText> : null}
              </Row>
              <Row trailing={<ThemedText>{trailing === null ? t("report.noProjection") : `${trailing}%`}</ThemedText>}><ThemedText>{t("report.trailing")}</ThemedText></Row>
              <Row last trailing={<ThemedText>{hasNetWorth ? money(summary.netWorthEnd! - summary.netWorthStart!) : t("report.noSnapshots")}</ThemedText>}>
                <ThemedText>{t("report.netWorthChange")}</ThemedText>
                {hasNetWorth ? <ThemedText variant="caption">{`${money(summary.netWorthStart!)} → ${money(summary.netWorthEnd!)}`}</ThemedText> : null}
              </Row>
            </Group>
          </View>

          {bucketIds.length > 0 ? (
            <View style={styles.section}>
              <ThemedText variant="headline">{t("report.spendingByBucket")}</ThemedText>
              <Group>
                {bucketIds.map((id, index) => (
                  <Row key={id} last={index === bucketIds.length - 1} trailing={<ThemedText>{money(bucketTotal(id))}</ThemedText>}><ThemedText>{bucketName(id)}</ThemedText></Row>
                ))}
              </Group>
            </View>
          ) : null}

          <View style={styles.section}>
            <ThemedText variant="headline">{t("report.months")}</ThemedText>
            <Group>
              {summary.months.map((m, index) => (
                <Row key={m.key} last={index === summary.months.length - 1} trailing={<ThemedText variant={m.key === thisMonth ? "headline" : "body"} style={negative(m.saved)}>{money(m.saved)}</ThemedText>}>
                  <ThemedText variant={m.key === thisMonth ? "headline" : "body"}>{formatMonthKey(m.key, i18n.language)}</ThemedText>
                  <ThemedText variant="caption">
                    {`${t("income.received")} ${money(m.received)} · ${t("plan.spent")} ${money(m.spent)} · ${m.savingRate === null ? "—" : `${m.savingRate}%`}`}
                  </ThemedText>
                </Row>
              ))}
            </Group>
          </View>

          <View style={styles.section}>
            <ThemedText variant="headline">{t("report.topCategories")}</ThemedText>
            <Group>
              {categories.length === 0 ? <Row last><ThemedText variant="subhead">{t("transactions.none")}</ThemedText></Row> : null}
              {categories.map(([name, amount], index) => (
                <Row key={name} last={index === categories.length - 1} trailing={<ThemedText>{money(amount)}</ThemedText>}><ThemedText>{name}</ThemedText></Row>
              ))}
            </Group>
          </View>
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  years: { flexDirection: "row", gap: spacing.sm },
})
