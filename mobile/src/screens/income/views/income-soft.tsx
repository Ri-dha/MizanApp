import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { MonthSwitcher } from "@/components/month-switcher"
import { Group, Row } from "@/components/row"
import { Badge, Bar, Card, HeroAmount, Section } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, type } from "@/theme"
import type { IncomeScreenModel } from "../use-income-screen"

/** Soft: a hero card with what has come in against the plan, then the expected payments and the sources. */
export function IncomeSoft({ model }: { model: IncomeScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const empty = model.occurrences.length === 0 && model.irregular.length === 0
  return (
    <>
      <MonthSwitcher monthKey={model.monthKey} onChange={model.setMonthKey} />
      <Card>
        <View style={styles.between}>
          <ThemedText variant="headline" style={styles.grow}>{t("income.received")}</ThemedText>
          {model.allReceived ? <Badge tone="ok">{t("plan.allIn")}</Badge> : null}
        </View>
        <HeroAmount tone="ok">{model.received}</HeroAmount>
        <Bar thick tone="ok" percent={model.receivedPercent} />
        <ThemedText variant="caption">{t("plan.ofPlannedShort", { amount: model.planned })}</ThemedText>
      </Card>

      <Section title={t("income.thisMonth")}>
        <Group>
          {empty ? <Row last><ThemedText variant="subhead">{t("income.nothingPlanned")}</ThemedText></Row> : null}
          {model.occurrences.map((occurrence, index) => (
            <Row
              key={occurrence.key}
              testID={`occurrence-${occurrence.sourceId}`}
              last={model.irregular.length === 0 && index === model.occurrences.length - 1}
              trailing={
                <View style={styles.end}>
                  <ThemedText style={[type.amount, occurrence.receiptId ? styles.positive : null]}>{occurrence.amount}</ThemedText>
                  {occurrence.receiptId
                    ? <Button testID={`receipt-${occurrence.receiptId}`} variant="ghost" title={t("income.received")} onPress={occurrence.open} />
                    : <Button testID={`receive-${occurrence.sourceId}`} variant={occurrence.overdue ? "primary" : "secondary"} title={t("income.markReceived")} onPress={occurrence.open} />}
                </View>
              }
            >
              <View style={styles.main}>
                <ThemedText numberOfLines={1}>{occurrence.name}</ThemedText>
                <ThemedText variant="caption" numberOfLines={1}>{occurrence.detail}</ThemedText>
                {occurrence.overdue ? <Badge tone="warn">{t("income.overdue")}</Badge> : null}
              </View>
            </Row>
          ))}
          {model.irregular.map((receipt, index) => (
            <LinkRow key={receipt.id} last={index === model.irregular.length - 1} href={receipt.href} trailing={<ThemedText style={[type.amount, styles.positive]}>{receipt.amount}</ThemedText>}>
              <ThemedText numberOfLines={1}>{receipt.name}</ThemedText>
              <ThemedText variant="caption">{receipt.detail}</ThemedText>
            </LinkRow>
          ))}
        </Group>
        <Button testID="add-irregular" variant="ghost" title={t("income.addIrregular")} style={styles.start} onPress={model.addIrregular} />
      </Section>

      <Section title={t("income.sources")} note={t("income.sourcesHint")}>
        <Group>
          {model.sources.length === 0 ? <Row last><ThemedText variant="subhead">{t("income.noSources")}</ThemedText></Row> : null}
          {model.sources.map((source, index) => (
            <LinkRow key={source.id} testID={`source-${source.id}`} href={source.href} last={index === model.sources.length - 1} trailing={<ThemedText style={type.amount}>{source.amount}</ThemedText>}>
              <ThemedText numberOfLines={1}>{source.name}</ThemedText>
              <ThemedText variant="caption" numberOfLines={1}>{source.detail}</ThemedText>
              {source.end ? <Button testID={`end-source-${source.id}`} variant="ghost" title={t("income.end")} style={styles.endSource} onPress={source.end} /> : null}
            </LinkRow>
          ))}
        </Group>
      </Section>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  between: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  grow: { flex: 1 },
  main: { gap: spacing.xs },
  end: { alignItems: "flex-end", gap: spacing.xs },
  positive: { color: colors.success },
  start: { alignSelf: "flex-start" },
  endSource: { alignSelf: "flex-start", paddingHorizontal: 0 },
}))
