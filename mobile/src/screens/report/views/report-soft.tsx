import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { MonthSwitcher } from "@/components/month-switcher"
import { Group, Row } from "@/components/row"
import { Bar, Card, Dot, HeroAmount, Line, Section } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, type } from "@/theme"
import type { ReportScreenModel } from "../use-report-screen"

/** Soft: the saving rate as the hero, each bucket's spending as a coloured bar, then the top categories with their share. */
export function ReportSoft({ model }: { model: ReportScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <MonthSwitcher monthKey={model.monthKey} onChange={model.setMonthKey} />
      <Card>
        <ThemedText variant="headline">{t("report.summary")}</ThemedText>
        {model.rate !== null ? (
          <View accessible accessibilityLabel={t("report.savingRate", { rate: model.rate })}>
            <ThemedText variant="caption">{t("report.rate")}</ThemedText>
            <HeroAmount testID="report-saving-rate">{`${model.rate}%`}</HeroAmount>
          </View>
        ) : null}
        <Line label={t("income.received")} value={model.received} strong />
        <Line label={t("plan.spent")} value={model.spent} strong />
        <ThemedText variant="subhead" style={model.spendingUp ? styles.negative : null}>{t("report.monthOverMonth", { delta: model.change })}</ThemedText>
      </Card>

      {model.simple ? null : (
        <Section title={t("report.plannedVsActual")}>
          <Card style={styles.buckets}>
            {model.buckets.length === 0 ? <ThemedText variant="subhead">{t("plan.noBuckets")}</ThemedText> : null}
            {model.buckets.map((bucket) => (
              <View key={bucket.id} style={styles.bucket}>
                <View style={styles.inline}>
                  <Dot colour={bucket.colour} />
                  <ThemedText variant="subhead" style={styles.name} numberOfLines={1}>{bucket.name}</ThemedText>
                  <ThemedText variant="subhead" style={[styles.actual, bucket.over ? styles.negative : null]}>{bucket.actual}</ThemedText>
                  <ThemedText variant="caption">{`/ ${bucket.allocated}`}</ThemedText>
                </View>
                <Bar thick percent={bucket.percent} colour={bucket.colour} tone={bucket.over ? "danger" : undefined} />
              </View>
            ))}
          </Card>
        </Section>
      )}

      <Section title={t("report.topCategories")}>
        <Group>
          {model.categories.length === 0 ? <Row last><ThemedText variant="subhead">{t("transactions.none")}</ThemedText></Row> : null}
          {model.categories.map((category, index) => (
            <Row key={category.name} last={index === model.categories.length - 1} trailing={<ThemedText style={type.amount}>{category.amount}</ThemedText>}>
              <View style={styles.bucket}>
                <ThemedText numberOfLines={1}>{category.name}</ThemedText>
                <Bar percent={category.percent} />
              </View>
            </Row>
          ))}
        </Group>
      </Section>

      <Button testID="report-pdf" variant="secondary" title={t("report.savePdf")} onPress={model.savePdf} />
      {model.simple ? null : (
        <Group>
          <LinkRow testID="open-year-report" href="/report-year" last><ThemedText>{t("report.year")}</ThemedText></LinkRow>
        </Group>
      )}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  buckets: { gap: spacing.md },
  bucket: { gap: spacing.xs + 2 },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { flex: 1, color: colors.label },
  actual: { color: colors.label, fontWeight: "600", fontVariant: ["tabular-nums"] },
  negative: { color: colors.destructive },
}))
