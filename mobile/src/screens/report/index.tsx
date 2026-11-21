import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { savingRate, spentByCategory } from "@mizan/core/db/report"
import { shiftKey } from "@mizan/core/domain/calendar/month"
import { formatMoney } from "@/utils/money"
import { monthFlow, type MonthView } from "@mizan/core/db/monthView"
import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { MonthSwitcher } from "@/components/month-switcher"
import { ProgressBar } from "@/components/progress-bar"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useAppMode } from "@/hooks/use-app-mode"
import { useSession } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMonthView } from "@/hooks/use-views"
import { shareReportPdf } from "@/platform/report-pdf"
import { radius, spacing, useBrandColors } from "@/theme"
import { formatMonthKey } from "@/utils/month"

const TOP_CATEGORIES = 5
const FULL = 100

const bucketSpent = (view: MonthView) => view.figures.buckets.reduce((s, b) => s + b.spent, 0)

/** FR-RPT-02: planned versus actual per bucket, the biggest categories, and the change from last month. */
export function MonthReport() {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const month = useMonthView(monthKey, startDay)
  const previous = useMonthView(shiftKey(monthKey, -1), startDay)
  const money = (v: number) => formatMoney(v, base, i18n.language)
  const signed = (v: number) => (v > 0 ? "+" : "") + money(v)
  const simple = useAppMode() === "simple"
  // Simple mode has no buckets, so its month is everything that came in and went out (ADR mode-1).
  const spentIn = (view: MonthView) => (simple ? monthFlow(view).spent : bucketSpent(view))
  const spent = spentIn(month)
  const received = simple ? monthFlow(month).received : month.income.received
  const rate = savingRate(received, spent)
  const categories = Object.entries(spentByCategory(month.transactions, t("report.uncategorised"))).sort((a, b) => b[1] - a[1]).slice(0, TOP_CATEGORIES)

  function savePdf() {
    return shareReportPdf(`mizan-report-${monthKey}`, `${t("report.title")} · ${formatMonthKey(monthKey, i18n.language)}`, session?.householdName ?? "", [
      {
        heading: t("report.summary"),
        rows: [
          [t("income.received"), money(received)],
          [t("plan.spent"), money(spent)],
          ...(rate !== null ? [[t("report.rate"), `${rate}%`] as [string, string]] : []),
          [t("report.monthOverMonth", { delta: "" }).replace(/[:：]?\s*$/, ""), signed(spent - spentIn(previous))],
        ],
      },
      ...(simple ? [] : [{
        heading: t("report.plannedVsActual"),
        rows: month.figures.buckets.map((f): [string, string] => [month.buckets.find((b) => b.id === f.id)?.name ?? "", `${money(f.spent + f.transfersOut)} / ${money(f.allocated)}`]),
      }]),
      { heading: t("report.topCategories"), rows: categories.map(([name, amount]) => [name, money(amount)]) },
    ], i18n.language === "ar")
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("report.title") }} />
      <MonthSwitcher monthKey={monthKey} onChange={setMonthKey} />

      <View style={styles.section}>
        <ThemedText variant="headline">{t("report.summary")}</ThemedText>
        <Group>
          <Row trailing={<ThemedText>{money(received)}</ThemedText>}><ThemedText>{t("income.received")}</ThemedText></Row>
          <Row trailing={<ThemedText>{money(spent)}</ThemedText>}><ThemedText>{t("plan.spent")}</ThemedText></Row>
          {rate !== null ? <Row><ThemedText testID="report-saving-rate">{t("report.savingRate", { rate })}</ThemedText></Row> : null}
          <Row last><ThemedText variant="subhead">{t("report.monthOverMonth", { delta: signed(spent - spentIn(previous)) })}</ThemedText></Row>
        </Group>
      </View>

      {simple ? null : <View style={styles.section}>
        <ThemedText variant="headline">{t("report.plannedVsActual")}</ThemedText>
        <Group>
          {month.figures.buckets.length === 0 ? <Row last><ThemedText variant="subhead">{t("plan.noBuckets")}</ThemedText></Row> : null}
          {month.figures.buckets.map((figure, index) => {
            const bucket = month.buckets.find((b) => b.id === figure.id)
            const actual = figure.spent + figure.transfersOut
            const percent = figure.allocated > 0 ? Math.min(FULL, Math.round((actual * FULL) / figure.allocated)) : 0
            const over = actual > figure.allocated
            return (
              <Row key={figure.id} last={index === month.figures.buckets.length - 1}>
                <View style={styles.bucketLine}>
                  <View style={styles.name}>
                    <View style={[styles.swatch, { backgroundColor: bucket?.colour }]} />
                    <ThemedText numberOfLines={1}>{bucket?.name ?? ""}</ThemedText>
                  </View>
                  <ThemedText variant="subhead" style={over ? { color: brand.destructive } : null}>{`${money(actual)} / ${money(figure.allocated)}`}</ThemedText>
                </View>
                <ProgressBar percent={percent} />
              </Row>
            )
          })}
        </Group>
      </View>}

      <View style={styles.section}>
        <ThemedText variant="headline">{t("report.topCategories")}</ThemedText>
        <Group>
          {categories.length === 0 ? <Row last><ThemedText variant="subhead">{t("transactions.none")}</ThemedText></Row> : null}
          {categories.map(([name, amount], index) => (
            <Row key={name} last={index === categories.length - 1} trailing={<ThemedText>{money(amount)}</ThemedText>}><ThemedText>{name}</ThemedText></Row>
          ))}
        </Group>
      </View>

      <Button testID="report-pdf" variant="secondary" title={t("report.savePdf")} onPress={() => void savePdf()} />
      {simple ? null : (
        <Group>
          <LinkRow testID="open-year-report" href="/report-year" last><ThemedText>{t("report.year")}</ThemedText></LinkRow>
        </Group>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  bucketLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  name: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  swatch: { width: spacing.sm + spacing.xs, height: spacing.sm + spacing.xs, borderRadius: radius.full },
})
