import { useTranslation } from "react-i18next"
import { FlatList, View } from "react-native"

import { dismissConflict, liveConflicts } from "@mizan/core/db/conflicts"
import { dismissSyncRejection, liveSyncRejections, type SyncRejection } from "@mizan/core/db/syncRejections"
import type { LocalConflict } from "@mizan/core/schema"
import { syncNow } from "@mizan/core/sync/engine"
import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSyncStatus } from "@/hooks/use-core"
import { spacing, makeStyles } from "@/theme"
import { formatWhen } from "@/utils/dates"

const NONE: LocalConflict[] = []
const NO_REJECTIONS: SyncRejection[] = []
const show = (value: unknown) => (value === null || value === undefined ? "—" : typeof value === "string" ? value : JSON.stringify(value))

export function Sync() {
  const styles = useStyles()
  const { t, i18n } = useTranslation()
  const status = useSyncStatus()
  const conflicts = useLiveQuery(liveConflicts, [], NONE)
  const rejections = useLiveQuery(liveSyncRejections, [], NO_REJECTIONS)
  const when = (iso: string) => formatWhen(iso, i18n.language)
  const lastSync = status.lastSyncAt
    ? t("sync.lastSync", { when: formatWhen(status.lastSyncAt, i18n.language) })
    : t("sync.never")
  const headline = status.pending > 0 ? t("sync.status.pending", { count: status.pending }) : t(`sync.status.${status.phase}`)

  return (
    <FlatList
      style={styles.page}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      data={conflicts}
      keyExtractor={(conflict) => conflict.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Group>
            <Row last>
              <ThemedText testID="sync-headline" variant="headline">{headline}</ThemedText>
              <ThemedText variant="subhead">{status.lastError ? `${lastSync} · ${status.lastError}` : lastSync}</ThemedText>
            </Row>
          </Group>
          <Button testID="sync-now" title={t("sync.syncNow")} loading={status.phase === "syncing"} onPress={() => void syncNow()} />
          {rejections.length > 0 ? (
            <View style={styles.section}>
              <ThemedText variant="headline">{t("sync.rejectedTitle")}</ThemedText>
              <ThemedText variant="subhead">{t("sync.rejectedBody")}</ThemedText>
              <Group>
                {rejections.map((rejection, index) => (
                  <Row
                    key={rejection.opId}
                    testID={`rejected-${rejection.opId}`}
                    last={index === rejections.length - 1}
                    trailing={<Button variant="ghost" title={t("sync.dismiss")} onPress={() => void dismissSyncRejection(rejection.opId)} />}
                  >
                    <ThemedText variant="headline">{`${t(`sync.tables.${rejection.table}`)} · ${when(rejection.rejectedAt)}`}</ThemedText>
                    <ThemedText variant="subhead">{t("sync.rejectedReason", { code: rejection.code })}</ThemedText>
                  </Row>
                ))}
              </Group>
            </View>
          ) : null}
          <View style={styles.section}>
            <ThemedText variant="headline">{t("sync.conflictsTitle")}</ThemedText>
            <ThemedText variant="subhead">{t("sync.conflictsBody")}</ThemedText>
          </View>
        </View>
      }
      ListEmptyComponent={<ThemedText testID="no-conflicts" variant="subhead">{t("sync.noConflicts")}</ThemedText>}
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      renderItem={({ item }) => (
        <Group>
          <Row last testID={`conflict-${item.id}`} trailing={<Button variant="ghost" title={t("sync.dismiss")} onPress={() => void dismissConflict(item.id)} />}>
            <ThemedText variant="headline">{`${item.table} · ${item.field}`}</ThemedText>
            <ThemedText variant="subhead">{`${t("sync.yours")}: ${show(item.clientValue)}`}</ThemedText>
            <ThemedText variant="subhead">{`${t("sync.kept")}: ${show(item.serverValue)}`}</ThemedText>
          </Row>
        </Group>
      )}
    />
  )
}

const useStyles = makeStyles((colors) => ({
  page: { backgroundColor: colors.background },
  content: { padding: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.md },
  section: { gap: spacing.xs, marginTop: spacing.md },
  gap: { height: spacing.sm },
}))

