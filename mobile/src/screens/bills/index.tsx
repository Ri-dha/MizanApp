import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { liveRecurringExpenses, undoBillPaid, type BillDue } from "@mizan/core/db/expenses"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { subscriptionSummary } from "@mizan/core/domain/expense/subscriptions"
import { formatMoney } from "@/utils/money"
import type { RecurringExpense } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { MonthSwitcher } from "@/components/month-switcher"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMetals, useMonthView } from "@/hooks/use-views"
import { spacing } from "@/theme"
import { formatDay } from "@/utils/dates"
import { useScreenTour } from "@/tours"

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }

export function Bills() {
  const { t, i18n } = useTranslation()
  useScreenTour("bills")
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const base = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const expenses = useLiveQuery(liveRecurringExpenses, [], [])
  const { prices } = useMetals()
  const today = todayIso()
  const money = (amount: number, currency = base) => formatMoney(amount, currency, i18n.language)
  const date = (iso: string) => formatDay(iso, i18n.language, DAY_MONTH)
  const bucketName = (id: string | null) => view.buckets.find((b) => b.id === id)?.name
  const withBucket = (text: string, id: string | null) => (bucketName(id) ? `${text} · ${bucketName(id)}` : text)
  const stillDue = view.bills.filter((b) => !b.occurrence).reduce((sum, b) => sum + b.expectedAmount, 0)
  const paid = view.bills.reduce((sum, b) => sum + (b.occurrence?.actualAmount ?? 0), 0)
  const shown = new Set(view.bills.map((b) => b.expense.id))
  const thisMonth = [...new Map(view.bills.map((b) => [b.expense.id, b.expense])).values()]
  const others = expenses.filter((e) => !shown.has(e.id))
  const subscriptions = subscriptionSummary(expenses, today, prices.usdBaseMicros)

  const editHref = (expense: RecurringExpense) => ({ pathname: "/bill-edit" as const, params: { id: expense.id } })

  function action(bill: BillDue) {
    if (bill.occurrence) {
      const occurrence = bill.occurrence
      return <Button testID={`undo-bill-${bill.expense.id}`} variant="ghost" title={t("bills.undo")} onPress={() => void undoBillPaid(occurrence)} />
    }
    const overdue = bill.dueDate < today
    return (
      <Button
        testID={`pay-bill-${bill.expense.id}`}
        variant={overdue ? "primary" : "secondary"}
        title={overdue ? t("bills.overdue") : t("bills.markPaid")}
        onPress={() => router.push({ pathname: "/bill-paid", params: { id: bill.expense.id, dueDate: bill.dueDate, monthKey } })}
      />
    )
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("bills.title"), headerRight: () => <Button testID="add-bill" variant="ghost" title={t("bills.add")} onPress={() => router.push("/bill-edit")} /> }} />
      <MonthSwitcher monthKey={monthKey} onChange={setMonthKey} />

      <View style={styles.section}>
        <ThemedText variant="headline">{t("bills.thisMonth")}</ThemedText>
        <ThemedText variant="caption">{`${t("bills.stillDue")}: ${money(stillDue)} · ${t("bills.paid")}: ${money(paid)}`}</ThemedText>
        <Group>
          {view.bills.length === 0 ? <Row last><ThemedText variant="subhead">{t("bills.nothingDue")}</ThemedText></Row> : null}
          {view.bills.map((bill, index) => (
            <Row key={`${bill.expense.id}-${bill.dueDate}`} testID={`bill-${bill.expense.id}`} last={index === view.bills.length - 1} trailing={action(bill)}>
              <ThemedText numberOfLines={1}>{bill.expense.name}</ThemedText>
              <ThemedText variant="caption" numberOfLines={1}>
                {withBucket(bill.occurrence ? t("bills.paidOn", { date: date(bill.occurrence.paidOn) }) : t("bills.dueOn", { date: date(bill.dueDate) }), bill.expense.bucketId)}
              </ThemedText>
              <ThemedText variant="headline">
                {`${bill.expense.isEstimate && !bill.occurrence ? "≈ " : ""}${money(bill.occurrence?.actualAmount ?? bill.expectedAmount)}`}
              </ThemedText>
            </Row>
          ))}
        </Group>
      </View>

      <View style={styles.section}>
        <ThemedText variant="headline">{t("bills.recurring")}</ThemedText>
        <Group>
          {expenses.length === 0 ? <Row last><ThemedText variant="subhead">{t("bills.none")}</ThemedText></Row> : null}
          {thisMonth.map((expense, index) => (
            <LinkRow
              key={expense.id}
              testID={`edit-bill-${expense.id}`}
              href={editHref(expense)}
              last={index === thisMonth.length - 1 && others.length === 0}
              trailing={<ThemedText variant="headline">{money(expense.amount, expense.currency)}</ThemedText>}
            >
              <ThemedText numberOfLines={1}>{expense.name}</ThemedText>
              <ThemedText variant="caption" numberOfLines={1}>
                {withBucket(expense.isEstimate ? `${t(`bills.frequencies.${expense.frequency}`)} · ${t("bills.estimate")}` : t(`bills.frequencies.${expense.frequency}`), expense.bucketId)}
              </ThemedText>
            </LinkRow>
          ))}
          {others.map((expense, index) => (
            <LinkRow key={expense.id} testID={`edit-bill-${expense.id}`} href={editHref(expense)} last={index === others.length - 1}>
              <ThemedText numberOfLines={1}>{expense.name}</ThemedText>
              <ThemedText variant="caption">{`${t(`bills.frequencies.${expense.frequency}`)} · ${t("bills.notThisMonth")}`}</ThemedText>
            </LinkRow>
          ))}
        </Group>
      </View>

      <View style={styles.section}>
        <ThemedText variant="headline">{t("subscriptions.title")}</ThemedText>
        <ThemedText variant="caption">
          {subscriptions.lines.length === 0
            ? t("subscriptions.empty")
            : t("subscriptions.totals", { monthly: money(subscriptions.monthlyBase), yearly: money(subscriptions.yearlyBase) })}
          {subscriptions.lines.length > 0 && subscriptions.monthlyUsd !== null
            ? ` · ${t("subscriptions.totalsUsd", { monthly: money(subscriptions.monthlyUsd, "USD"), yearly: money(subscriptions.yearlyUsd ?? 0, "USD") })}`
            : ""}
        </ThemedText>
        {subscriptions.lines.length > 0 ? (
          <Group>
            {subscriptions.lines.map((line, index) => (
              <LinkRow
                key={line.expense.id}
                href={editHref(line.expense)}
                last={index === subscriptions.lines.length - 1}
                trailing={<ThemedText variant="subhead">{t("subscriptions.perYear", { amount: money(line.yearlyBase) })}</ThemedText>}
              >
                <ThemedText numberOfLines={1}>{line.expense.name}</ThemedText>
                <ThemedText variant="caption" numberOfLines={1}>{t("subscriptions.perMonth", { amount: money(line.monthlyBase) })}</ThemedText>
              </LinkRow>
            ))}
          </Group>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
})
