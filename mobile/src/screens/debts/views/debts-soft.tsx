import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { LinkRow } from "@/components/link-row"
import { Group, Row } from "@/components/row"
import { Card, Section, Stat, Stats } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing, type } from "@/theme"
import type { DebtsScreenModel } from "../use-debts-screen"

/** Soft: owe and owed tiles, the two lists, then the two payoff orders side by side with the cheaper one picked out. */
export function DebtsSoft({ model }: { model: DebtsScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()

  function list(title: string, body: string, side: DebtsScreenModel["owing"], owing: boolean) {
    return (
      <Section title={title} note={body}>
        <Group>
          {side.rows.length === 0 ? <Row last><ThemedText variant="subhead">{t("debts.none")}</ThemedText></Row> : null}
          {side.rows.map((debt, index) => (
            <LinkRow key={debt.id} testID={`debt-${debt.id}`} href={debt.href} last={index === side.rows.length - 1} trailing={<ThemedText style={[type.amount, owing && !debt.settled ? styles.negative : null]}>{debt.balance}</ThemedText>}>
              <ThemedText numberOfLines={1}>{debt.name}</ThemedText>
              <ThemedText variant="caption" numberOfLines={2}>{debt.detail}</ThemedText>
            </LinkRow>
          ))}
        </Group>
      </Section>
    )
  }

  return (
    <>
      {model.owing.total && model.owed.total ? (
        <Stats>
          <Stat label={t("debts.owing")} value={model.owing.total} tone="danger" />
          <Stat label={t("debts.owed")} value={model.owed.total} />
        </Stats>
      ) : null}
      {list(t("debts.owing"), t("debts.owingBody"), model.owing, true)}
      {list(t("debts.owed"), t("debts.owedBody"), model.owed, false)}
      {model.strategies ? (
        <Section title={t("debts.strategyTitle")} note={t("debts.strategyBody")}>
          <Card style={styles.card}>
            <TextField testID="strategy-extra" label={t("debts.extraPerMonth")} keyboardType="decimal-pad" value={model.extra} onChangeText={model.setExtra} />
            <View style={styles.pair}>
              {model.strategies.map((strategy) => (
                <View key={strategy.name} style={[styles.option, strategy.cheaper ? styles.chosen : null]}>
                  <ThemedText variant="headline" style={strategy.cheaper ? styles.chosenText : null}>{t(`debts.strategies.${strategy.name}`)}</ThemedText>
                  <ThemedText variant="caption">{t(`debts.strategyHints.${strategy.name}`)}</ThemedText>
                  <ThemedText variant="subhead" style={styles.order}>{strategy.order}</ThemedText>
                  <ThemedText variant="caption">{strategy.outcome}</ThemedText>
                </View>
              ))}
            </View>
            {model.difference ? <ThemedText variant="caption">{model.difference}</ThemedText> : null}
          </Card>
        </Section>
      ) : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  card: { gap: spacing.md },
  pair: { flexDirection: "row", gap: spacing.sm },
  option: { flex: 1, borderRadius: radius.md, borderCurve: "continuous", padding: spacing.sm + spacing.xs, gap: spacing.xs, backgroundColor: colors.fill, borderWidth: 1.5, borderColor: "transparent" },
  chosen: { backgroundColor: colors.accent, borderColor: colors.link },
  chosenText: { color: colors.onAccent },
  order: { color: colors.label },
  negative: { color: colors.destructive },
}))
