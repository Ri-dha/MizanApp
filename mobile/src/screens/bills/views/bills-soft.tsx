import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { MonthSwitcher } from "@/components/month-switcher"
import { Group, Row } from "@/components/row"
import { Badge, Dot, Section, Stat, Stats, type Tone } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, type } from "@/theme"
import type { BillRow, BillsScreenModel } from "../use-bills-screen"

const TONES: Record<BillRow["state"], Tone> = { paid: "ok", overdue: "warn", today: "info", upcoming: "neutral" }

/** Soft: still-due and paid tiles, then each bill with its bucket dot, a status badge and the amount over its action. */
export function BillsSoft({ model }: { model: BillsScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const label = (bill: BillRow) =>
    bill.state === "paid" ? t("bills.paid") : bill.state === "overdue" ? t("bills.overdue") : bill.state === "today" ? t("bills.dueToday") : bill.estimate ? t("bills.estimate") : null

  function action(bill: BillRow) {
    if (bill.undo) return <Button testID={`undo-bill-${bill.id}`} variant="ghost" title={t("bills.undo")} onPress={bill.undo} />
    return <Button testID={`pay-bill-${bill.id}`} variant={bill.state === "overdue" ? "primary" : "secondary"} title={t("bills.markPaid")} onPress={bill.pay} />
  }

  return (
    <>
      <MonthSwitcher monthKey={model.monthKey} onChange={model.setMonthKey} />
      <Stats>
        <Stat label={t("bills.stillDue")} value={model.stillDue} />
        <Stat label={t("bills.paid")} value={model.paid} tone="ok" />
      </Stats>

      <Section title={t("bills.thisMonth")}>
        <Group>
          {model.bills.length === 0 ? <Row last><ThemedText variant="subhead">{t("bills.nothingDue")}</ThemedText></Row> : null}
          {model.bills.map((bill, index) => (
            <Row
              key={bill.key}
              testID={`bill-${bill.id}`}
              last={index === model.bills.length - 1}
              trailing={<View style={styles.end}><ThemedText style={[type.amount, bill.state === "paid" ? styles.muted : null]}>{bill.amount}</ThemedText>{action(bill)}</View>}
            >
              <View style={styles.main}>
                <ThemedText numberOfLines={1}>{bill.name}</ThemedText>
                <View style={styles.inline}><Dot colour={bill.colour} size={8} /><ThemedText variant="caption" numberOfLines={1} style={styles.grow}>{bill.detail}</ThemedText></View>
                {label(bill) ? <Badge tone={TONES[bill.state]}>{label(bill) ?? ""}</Badge> : null}
              </View>
            </Row>
          ))}
        </Group>
      </Section>

      <Section title={t("bills.recurring")}>
        <Group>
          {model.hasExpenses ? null : <Row last><ThemedText variant="subhead">{t("bills.none")}</ThemedText></Row>}
          {model.recurring.map((expense, index) => (
            <LinkRow
              key={expense.id}
              testID={`edit-bill-${expense.id}`}
              href={expense.href}
              last={index === model.recurring.length - 1}
              trailing={expense.amount ? <ThemedText style={type.amount}>{expense.amount}</ThemedText> : undefined}
            >
              <ThemedText numberOfLines={1}>{expense.name}</ThemedText>
              <ThemedText variant="caption" numberOfLines={1}>{expense.detail}</ThemedText>
            </LinkRow>
          ))}
        </Group>
      </Section>

      <Section title={t("subscriptions.title")} note={model.subscriptionsNote}>
        {model.subscriptions.length > 0 ? (
          <Group>
            {model.subscriptions.map((line, index) => (
              <LinkRow key={line.id} href={line.href} last={index === model.subscriptions.length - 1} trailing={<ThemedText variant="subhead">{line.perYear}</ThemedText>}>
                <ThemedText numberOfLines={1}>{line.name}</ThemedText>
                <ThemedText variant="caption" numberOfLines={1}>{line.perMonth}</ThemedText>
              </LinkRow>
            ))}
          </Group>
        ) : null}
      </Section>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  main: { gap: spacing.xs },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.xs + 2 },
  grow: { flex: 1 },
  end: { alignItems: "flex-end", gap: spacing.xs + 2 },
  muted: { color: colors.tertiaryLabel },
}))
