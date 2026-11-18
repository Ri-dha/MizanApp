import { Link, Stack, router } from "expo-router"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, SectionList, StyleSheet, View } from "react-native"
import { SegmentedControl } from "@expo/ui/community/segmented-control"

import { formatDate } from "@mizan/core/domain/calendar/hijri"
import { formatMoney } from "@mizan/core/domain/money/format"
import { EMPTY_FILTER, filterTransactions, liveRecentlyDeleted, liveTransactionsFor, restoreTransaction } from "@mizan/core/db/transactions"
import type { LedgerTransaction, TransactionType } from "@mizan/core/schema"
import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Row } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession, useSyncStatus } from "@/hooks/use-core"
import { useSelectedMonth } from "@/hooks/use-selected-month"
import { useMonthView } from "@/hooks/use-views"
import { MonthSwitcher } from "@/components/month-switcher"
import { colors, radius, spacing, type } from "@/theme"

const NO_ROWS: LedgerTransaction[] = []
const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }
const TYPE_FILTERS: (TransactionType | null)[] = [null, "EXPENSE", "TRANSFER", "INCOME"]

interface Section {
  key: string
  title: string
  data: LedgerTransaction[]
  deleted?: boolean
}

export function Ledger() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const status = useSyncStatus()
  const startDay = session?.monthStartDay ?? 1
  const [monthKey, setMonthKey] = useSelectedMonth(startDay)
  const [text, setText] = useState("")
  const [typeFilter, setTypeFilter] = useState<TransactionType | null>(null)
  const view = useMonthView(monthKey, startDay)
  const month = useLiveQuery(() => liveTransactionsFor(monthKey), [monthKey], NO_ROWS)
  const deleted = useLiveQuery(liveRecentlyDeleted, [], NO_ROWS)
  const bucketName = (id: string | null) => view.buckets.find((b) => b.id === id)?.name
  const money = (row: LedgerTransaction) => formatMoney(row.type === "INCOME" ? row.amount : -row.amount, row.currency, i18n.language)
  const statusText = status.pending > 0 ? t("sync.status.pending", { count: status.pending }) : t(`sync.status.${status.phase}`)

  const sections = useMemo<Section[]>(() => {
    const matching = filterTransactions(month, { ...EMPTY_FILTER, text, type: typeFilter })
    const byDay = new Map<string, LedgerTransaction[]>()
    for (const row of matching) byDay.set(row.occurredOn, [...(byDay.get(row.occurredOn) ?? []), row])
    const days: Section[] = [...byDay.entries()].map(([day, data]) => ({ key: day, title: formatDate(day, i18n.language, false, DAY), data }))
    return deleted.length > 0 && !text && !typeFilter ? [...days, { key: "deleted", title: t("transactions.recentlyDeleted"), data: deleted, deleted: true }] : days
  }, [month, deleted, text, typeFilter, i18n.language, t])

  return (
    <>
      <Stack.Screen
        options={{
          title: t("transactions.title"),
          headerRight: () => <Button testID="open-add-transaction" variant="ghost" title={t("transactions.add")} onPress={() => router.push("/transaction")} />,
          headerSearchBarOptions: { placeholder: t("transactions.search"), onChangeText: (event) => setText(event.nativeEvent.text) },
        }}
      />
      <SectionList
        style={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        sections={sections}
        keyExtractor={(row) => row.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            {session && !session.verified ? (
              <Link href="/verify" asChild>
                <Pressable testID="open-verify" accessibilityRole="link"><Notice>{`${t("auth.verifyTitle")} · ${t("auth.verify")}`}</Notice></Pressable>
              </Link>
            ) : null}
            <MonthSwitcher monthKey={monthKey} onChange={setMonthKey} />
            <SegmentedControl
              testID="type-filter"
              values={TYPE_FILTERS.map((value) => (value ? t(`transactions.types.${value}`) : t("transactions.allTypes")))}
              selectedIndex={TYPE_FILTERS.indexOf(typeFilter)}
              onChange={(event) => setTypeFilter(TYPE_FILTERS[event.nativeEvent.selectedSegmentIndex])}
            />
            <Link href="/sync" testID="sync-status" style={type.subhead}>{statusText}</Link>
          </View>
        }
        ListEmptyComponent={<ThemedText variant="subhead">{t("transactions.none")}</ThemedText>}
        renderSectionHeader={({ section }) => <ThemedText variant="subhead" style={styles.sectionTitle}>{section.title}</ThemedText>}
        renderItem={({ item, index, section }) => {
          const first = index === 0
          const last = index === section.data.length - 1
          return (
            <Pressable
              testID={`transaction-${item.id}`}
              onPress={() => (section.deleted ? undefined : router.push({ pathname: "/transaction", params: { id: item.id } }))}
              style={({ pressed }) => [styles.cell, first && styles.first, last && styles.last, pressed && !section.deleted ? styles.pressed : null]}
            >
              <Row
                last={last}
                trailing={
                  section.deleted ? (
                    <Button testID={`restore-${item.id}`} variant="ghost" title={t("accounts.restore")} onPress={() => void restoreTransaction(item.id)} />
                  ) : (
                    <ThemedText style={type.amount}>{money(item)}</ThemedText>
                  )
                }
              >
                <ThemedText>{item.payee ?? item.category ?? t(`transactions.types.${item.type}`)}</ThemedText>
                <ThemedText variant="caption">
                  {[bucketName(item.bucketId), item.category, item.splitGroupId ? t("transactions.splitBadge") : null].filter(Boolean).join(" · ") || " "}
                </ThemedText>
              </Row>
            </Pressable>
          )
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { marginTop: spacing.md, marginBottom: spacing.xs },
  cell: { backgroundColor: colors.surface, overflow: "hidden" },
  first: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  last: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  pressed: { backgroundColor: colors.fill },
})
