import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { AwaitingKey } from "@/components/awaiting-key"
import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { Card, HeroAmount, Line, Section, SectionTitle } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { AdvisorScreenModel } from "../use-advisor-screen"

/** Soft: the year between its two neighbours, a summary card led by the saving rate, then the months as rows. */
export function AdvisorSoft({ model }: { model: AdvisorScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { report } = model
  return (
    <>
      <AwaitingKey />
      <View style={styles.years}>
        <Button testID="advisor-previous" variant="secondary" title={String(model.year - 1)} onPress={model.previous} />
        <ThemedText variant="headline" style={styles.year}>{String(model.year)}</ThemedText>
        <Button testID="advisor-next" variant="secondary" title={String(model.year + 1)} onPress={model.next} />
      </View>
      <ThemedText variant="subhead">{t("advisor.body")}</ThemedText>
      {report ? (
        <>
          <Card>
            <SectionTitle>{`${t("report.yearTitle", { year: model.year })} · ${t("report.rate")}`}</SectionTitle>
            <HeroAmount>{report.rate}</HeroAmount>
            <ThemedText variant="caption">{t("report.savingRateDefinition")}</ThemedText>
            <Line label={t("income.received")} value={report.received} strong />
            <Line label={t("plan.spent")} value={report.spent} strong />
          </Card>
          <Section title={t("report.months")}>
            <Group>
              {report.months.map((month, index) => (
                <Row key={month.key} last={index === report.months.length - 1} trailing={<ThemedText style={[styles.figure, month.negative ? styles.negative : null]}>{month.saved}</ThemedText>}>
                  <ThemedText>{month.label}</ThemedText>
                  <ThemedText variant="caption">{month.detail}</ThemedText>
                </Row>
              ))}
            </Group>
          </Section>
        </>
      ) : (
        <Card><ThemedText testID="advisor-empty" variant="subhead">{t("advisor.noReport")}</ThemedText></Card>
      )}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  years: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  year: { flex: 1, textAlign: "center", fontVariant: ["tabular-nums"] },
  figure: { fontVariant: ["tabular-nums"], fontWeight: "600" },
  negative: { color: colors.destructive },
}))
