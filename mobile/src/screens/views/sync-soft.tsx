import { useTranslation } from "react-i18next"
import { FlatList, View } from "react-native"

import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { Badge, Card, Section, type Tone } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import type { SyncScreenModel } from "../use-sync-screen"

const TONES: Record<SyncScreenModel["phase"], Tone> = { idle: "ok", pending: "info", syncing: "info", offline: "warn", error: "danger" }
const MARKS: Record<SyncScreenModel["phase"], string> = { idle: "✓", pending: "…", syncing: "…", offline: "!", error: "!" }

/** Soft: the state in a hero card with a round mark, one wide Sync now button, then refused changes and overridden edits. */
export function SyncSoft({ model }: { model: SyncScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const tone = TONES[model.phase]
  return (
    <FlatList
      style={styles.page}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      data={model.conflicts}
      keyExtractor={(conflict) => conflict.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Card style={styles.hero}>
            <View style={[styles.mark, styles[`${tone}Surface`]]}><ThemedText style={[styles.markText, styles[`${tone}Text`]]}>{MARKS[model.phase]}</ThemedText></View>
            <View style={styles.grow}>
              <ThemedText testID="sync-headline" variant="headline">{model.headline}</ThemedText>
              <ThemedText variant="caption">{model.detail}</ThemedText>
            </View>
          </Card>
          <Button testID="sync-now" size="lg" title={t("sync.syncNow")} loading={model.syncing} onPress={model.syncNow} />
          {model.rejections.length > 0 ? (
            <Section title={t("sync.rejectedTitle")} note={t("sync.rejectedBody")} action={<Badge tone="danger">{String(model.rejections.length)}</Badge>}>
              <Group>
                {model.rejections.map((rejection, index) => (
                  <Row key={rejection.id} testID={`rejected-${rejection.id}`} last={index === model.rejections.length - 1} trailing={<Button variant="ghost" title={t("sync.dismiss")} onPress={rejection.dismiss} />}>
                    <ThemedText variant="headline">{rejection.title}</ThemedText>
                    <ThemedText variant="subhead">{rejection.reason}</ThemedText>
                  </Row>
                ))}
              </Group>
            </Section>
          ) : null}
          <Section title={t("sync.conflictsTitle")} note={t("sync.conflictsBody")} />
        </View>
      }
      ListEmptyComponent={<Group><Row last><ThemedText testID="no-conflicts" variant="subhead">{t("sync.noConflicts")}</ThemedText></Row></Group>}
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      renderItem={({ item }) => (
        <Group>
          <Row last testID={`conflict-${item.id}`} trailing={<Button variant="ghost" title={t("sync.dismiss")} onPress={item.dismiss} />}>
            <ThemedText variant="headline">{item.title}</ThemedText>
            <ThemedText variant="subhead">{item.yours}</ThemedText>
            <ThemedText variant="subhead">{item.kept}</ThemedText>
          </Row>
        </Group>
      )}
    />
  )
}

const useStyles = makeStyles((colors) => ({
  page: { backgroundColor: colors.background },
  content: { padding: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  hero: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  mark: { width: 44, height: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
  markText: { fontSize: 20, fontWeight: "700" },
  grow: { flex: 1 },
  gap: { height: spacing.sm },
  neutralSurface: { backgroundColor: colors.fill },
  okSurface: { backgroundColor: colors.successSurface },
  warnSurface: { backgroundColor: colors.warningSurface },
  infoSurface: { backgroundColor: colors.accent },
  dangerSurface: { backgroundColor: colors.destructiveSurface },
  goldSurface: { backgroundColor: colors.goldSurface },
  neutralText: { color: colors.secondaryLabel },
  okText: { color: colors.success },
  warnText: { color: colors.warning },
  infoText: { color: colors.onAccent },
  dangerText: { color: colors.destructive },
  goldText: { color: colors.gold },
}))
