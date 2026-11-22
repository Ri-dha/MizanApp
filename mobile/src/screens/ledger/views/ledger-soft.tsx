import { SegmentedControl } from "@expo/ui/community/segmented-control"
import { Link } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable, SectionList, View } from "react-native"

import { Button } from "@/components/button"
import { MonthSwitcher } from "@/components/month-switcher"
import { Notice } from "@/components/notice"
import { Badge, Lead, SectionTitle, SoftCard } from "@/components/soft"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing, type } from "@/theme"
import { TYPE_FILTERS, type LedgerScreenModel } from "../use-ledger-screen"

/** Soft: the month's money in and out as two tiles, then one card per day with a tile, the payee, its bucket and the amount on each row. */
export function LedgerSoft({ model }: { model: LedgerScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <SectionList
      style={styles.list}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      sections={model.sections}
      keyExtractor={(row) => row.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.header}>
          {model.verifyNotice ? (
            <Link href="/verify" asChild>
              <Pressable testID="open-verify" accessibilityRole="link"><Notice>{model.verifyNotice}</Notice></Pressable>
            </Link>
          ) : null}
          <MonthSwitcher monthKey={model.monthKey} onChange={model.setMonthKey} />
          <SegmentedControl
            testID="type-filter"
            values={model.typeLabels}
            selectedIndex={TYPE_FILTERS.indexOf(model.typeFilter)}
            onChange={(event) => model.setTypeFilter(TYPE_FILTERS[event.nativeEvent.selectedSegmentIndex])}
          />
          <View style={styles.tiles}>
            <SoftCard style={styles.tile}>
              <SectionTitle>{t("home.monthReceived")}</SectionTitle>
              <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={[styles.figure, styles.positive]}>{model.received}</ThemedText>
            </SoftCard>
            <SoftCard style={styles.tile}>
              <SectionTitle>{t("home.monthSpent")}</SectionTitle>
              <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.figure}>{model.spent}</ThemedText>
            </SoftCard>
          </View>
          <Link href="/sync" testID="sync-status" style={[type.subhead, styles.status]}>{model.statusText}</Link>
        </View>
      }
      ListEmptyComponent={<ThemedText variant="subhead">{t("transactions.none")}</ThemedText>}
      renderSectionHeader={({ section }) => <ThemedText style={styles.day}>{section.title}</ThemedText>}
      renderItem={({ item, index, section }) => {
        const first = index === 0
        const last = index === section.data.length - 1
        return (
          <Pressable
            testID={`transaction-${item.id}`}
            onPress={section.deleted ? undefined : item.open}
            style={({ pressed }) => [styles.cell, first && styles.first, last && styles.last, pressed && !section.deleted ? styles.pressed : null]}
          >
            <View style={[styles.row, last ? null : styles.divider]}>
              <Lead colour={item.bucketColour} />
              <View style={styles.main}>
                <ThemedText numberOfLines={1} style={styles.title}>{item.title}</ThemedText>
                <ThemedText numberOfLines={1} style={styles.detail}>{item.detail}</ThemedText>
              </View>
              {section.deleted ? (
                <Button testID={`restore-${item.id}`} variant="ghost" title={t("accounts.restore")} onPress={item.restore} />
              ) : (
                <View style={styles.end}>
                  <ThemedText style={[type.amount, item.flow === "in" ? styles.positive : item.flow === "moved" ? styles.moved : null]}>{item.amount}</ThemedText>
                  {item.split ? <Badge>{t("transactions.splitBadge")}</Badge> : null}
                </View>
              )}
            </View>
          </Pressable>
        )
      }}
    />
  )
}

const useStyles = makeStyles((colors) => ({
  list: { backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { gap: spacing.md, marginBottom: spacing.sm },
  tiles: { flexDirection: "row", gap: spacing.sm + spacing.xs },
  tile: { flex: 1, gap: 2, padding: spacing.md - 2 },
  figure: { fontSize: 20, lineHeight: 26, fontWeight: "600", fontVariant: ["tabular-nums"] },
  status: { color: colors.secondaryLabel },
  day: { fontSize: 13, lineHeight: 18, fontWeight: "600", color: colors.secondaryLabel, marginTop: spacing.md, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  cell: { backgroundColor: colors.surface, overflow: "hidden" },
  first: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  last: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  pressed: { backgroundColor: colors.fill },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md - spacing.xs, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md, minHeight: 56 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.separator },
  main: { flex: 1 },
  title: { fontSize: 16, lineHeight: 21 },
  detail: { fontSize: 13, lineHeight: 17, color: colors.tertiaryLabel },
  end: { alignItems: "flex-end", gap: 2 },
  positive: { color: colors.success },
  moved: { color: colors.secondaryLabel },
}))
