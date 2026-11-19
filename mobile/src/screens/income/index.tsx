import { router, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { currentAmount, updateIncomeSource } from "@mizan/core/db/income"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { formatMoney } from "@/utils/money"
import type { IncomeSource } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { MonthSwitcher } from "@/components/month-switcher"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMonthView } from "@/hooks/use-views"
import { spacing } from "@/theme"
import { formatDay } from "@/utils/dates"
import { useScreenTour } from "@/tours"

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }

export function Income() {
  const { t, i18n } = useTranslation()
  useScreenTour("income")
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const base = session?.baseCurrency ?? "IQD"
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const view = useMonthView(monthKey, startDay)
  const today = todayIso()
  const money = (amount: number, currency = base) => formatMoney(amount, currency, i18n.language)
  const date = (iso: string) => formatDay(iso, i18n.language, DAY_MONTH)
  const irregular = view.receipts.filter((r) => !view.occurrences.some((o) => o.receipt?.id === r.id))
  const openReceipt = (params: Record<string, string>) => router.push({ pathname: "/income-receipt", params: { monthKey, ...params } })

  function sourceLine(source: IncomeSource) {
    const ended = source.activeTo !== null && source.activeTo < today
    const parts = [t(`income.frequencies.${source.frequency}`)]
    if (source.frequency === "MONTHLY") parts.push(t("income.payDayShort", { day: source.payDay }))
    if (source.activeTo) parts.push(ended ? t("income.ended") : t("income.endsOn", { date: date(source.activeTo) }))
    return parts.join(" · ")
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t("income.title"), headerRight: () => <Button testID="add-source" variant="ghost" title={t("income.addSource")} onPress={() => router.push("/income-source")} /> }} />
      <MonthSwitcher monthKey={monthKey} onChange={setMonthKey} />

      <View style={styles.section}>
        <ThemedText variant="headline">{t("income.thisMonth")}</ThemedText>
        <ThemedText variant="caption">{`${t("income.planned")}: ${money(view.income.planned)} · ${t("income.received")}: ${money(view.income.received)}`}</ThemedText>
        <Group>
          {view.occurrences.length === 0 && irregular.length === 0 ? <Row last><ThemedText variant="subhead">{t("income.nothingPlanned")}</ThemedText></Row> : null}
          {view.occurrences.map((occurrence) => {
            const receipt = occurrence.receipt
            const overdue = occurrence.date < today
            return (
              <Row
                key={`${occurrence.source.id}-${occurrence.date}`}
                last={irregular.length === 0 && occurrence === view.occurrences[view.occurrences.length - 1]}
                testID={`occurrence-${occurrence.source.id}`}
                trailing={receipt
                  ? <Button testID={`receipt-${receipt.id}`} variant="ghost" title={t("income.received")} onPress={() => openReceipt({ receiptId: receipt.id })} />
                  : <Button
                      testID={`receive-${occurrence.source.id}`}
                      variant={overdue ? "primary" : "secondary"}
                      title={overdue ? t("income.overdue") : t("income.markReceived")}
                      onPress={() => openReceipt({ sourceId: occurrence.source.id, date: occurrence.date })}
                    />}
              >
                <ThemedText numberOfLines={1}>{occurrence.source.name}</ThemedText>
                <ThemedText variant="caption">{receipt ? t("income.receivedOn", { date: date(receipt.receivedOn) }) : t("income.expectedOn", { date: date(occurrence.date) })}</ThemedText>
                <ThemedText variant="headline">{money(receipt?.baseAmount ?? occurrence.amount)}</ThemedText>
              </Row>
            )
          })}
          {irregular.map((receipt) => (
            <LinkRow key={receipt.id} last={receipt === irregular[irregular.length - 1]} href={{ pathname: "/income-receipt", params: { monthKey, receiptId: receipt.id } }} trailing={<ThemedText variant="headline">{money(receipt.baseAmount)}</ThemedText>}>
              <ThemedText numberOfLines={1}>{receipt.note || t("income.irregular")}</ThemedText>
              <ThemedText variant="caption">{t("income.receivedOn", { date: date(receipt.receivedOn) })}</ThemedText>
            </LinkRow>
          ))}
        </Group>
        <Button testID="add-irregular" variant="ghost" title={t("income.addIrregular")} style={styles.start} onPress={() => openReceipt({})} />
      </View>

      <View style={styles.section}>
        <ThemedText variant="headline">{t("income.sources")}</ThemedText>
        <ThemedText variant="caption">{t("income.sourcesHint")}</ThemedText>
        <Group>
          {view.sources.length === 0 ? <Row last><ThemedText variant="subhead">{t("income.noSources")}</ThemedText></Row> : null}
          {view.sources.map((source, index) => {
            const canEnd = !source.activeTo && source.frequency !== "ONE_OFF"
            return (
              <LinkRow
                key={source.id}
                testID={`source-${source.id}`}
                href={{ pathname: "/income-source", params: { id: source.id } }}
                last={index === view.sources.length - 1}
                trailing={<ThemedText variant="headline">{money(currentAmount(source, view.amountHistory, today), source.currency)}</ThemedText>}
              >
                <ThemedText numberOfLines={1}>{source.name}</ThemedText>
                <ThemedText variant="caption" numberOfLines={1}>{sourceLine(source)}</ThemedText>
                {canEnd ? <Button testID={`end-source-${source.id}`} variant="ghost" title={t("income.end")} style={styles.end} onPress={() => void updateIncomeSource(source.id, { activeTo: today })} /> : null}
              </LinkRow>
            )
          })}
        </Group>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  end: { alignSelf: "flex-start", paddingHorizontal: 0 },
  start: { alignSelf: "flex-start" },
})
