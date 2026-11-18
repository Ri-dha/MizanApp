import { Link, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import { logout } from "@mizan/core/auth/session"
import { formatDate } from "@mizan/core/domain/calendar/hijri"
import { formatMoney } from "@mizan/core/domain/money/format"
import type { LedgerTransaction } from "@mizan/core/schema"
import { rows, sorted } from "@mizan/core/store/store"
import { syncNow } from "@mizan/core/sync/engine"
import { Button } from "@/components/button"
import { Row } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSyncStatus } from "@/hooks/use-core"
import { colors, radius, spacing, type } from "@/theme"

const NO_ROWS: LedgerTransaction[] = []
const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }

export function Ledger() {
  const { t, i18n } = useTranslation()
  const status = useSyncStatus()
  const transactions = useLiveQuery(() => sorted(rows("transactions", (row) => row.deletedAt === null), "occurredOn", "desc"), [], NO_ROWS)
  const statusText = status.pending > 0 ? t("sync.status.pending", { count: status.pending }) : t(`sync.status.${status.phase}`)

  return (
    <>
      <Stack.Screen
        options={{
          title: t("transactions.title"),
          headerRight: () => (
            <Link href="/add-transaction" asChild>
              <Button testID="open-add-transaction" variant="ghost" title={t("transactions.add")} />
            </Link>
          ),
        }}
      />
      <FlatList
        style={styles.list}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        data={transactions}
        keyExtractor={(row) => row.id}
        ListHeaderComponent={<ThemedText testID="sync-status" variant="subhead" onPress={() => void syncNow()}>{statusText}</ThemedText>}
        ListEmptyComponent={<ThemedText variant="subhead">{t("transactions.none")}</ThemedText>}
        renderItem={({ item, index }) => (
          <View style={[styles.cell, index === 0 && styles.first, index === transactions.length - 1 && styles.last]}>
            <Row testID={`transaction-${item.id}`} last={index === transactions.length - 1} trailing={<ThemedText style={type.amount}>{formatMoney(item.amount, item.currency, i18n.language)}</ThemedText>}>
              <ThemedText variant="body">{item.payee ?? "—"}</ThemedText>
              <ThemedText variant="caption">{formatDate(item.occurredOn, i18n.language, false, DAY)}</ThemedText>
            </Row>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Link href="/diagnostics" testID="open-diagnostics" style={type.subhead}>Diagnostics</Link>
            <Button testID="sign-out" variant="secondary" title={t("auth.logout")} onPress={() => void logout()} />
          </View>
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { padding: spacing.md },
  cell: { backgroundColor: colors.surface, overflow: "hidden" },
  first: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md, marginTop: spacing.sm },
  last: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  footer: { gap: spacing.md, marginTop: spacing.xl },
})
