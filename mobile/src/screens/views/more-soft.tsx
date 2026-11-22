import { Link } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { Lead, SectionTitle } from "@/components/soft"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing, useColors } from "@/theme"
import type { MoreScreenModel } from "../use-more-screen"

/** The tile colour of each destination, as a place in the template's bucket colours; net worth takes the main colour and the app's own screens the accent. */
const TILES: Record<string, number> = { accounts: 4, income: 2, bills: 1, debts: 5, metals: 6, assets: 7, goals: 3, report: 0, prices: 4 }

/** Soft: destinations in named groups, each row led by a coloured tile, and Sign out as a quiet button at the end. */
export function MoreSoft({ model }: { model: MoreScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const colors = useColors()
  return (
    <>
      {model.groups.map((group) => (
        <View key={group.id} style={styles.section}>
          <View style={styles.heading}><SectionTitle>{group.title}</SectionTitle></View>
          <View style={styles.group}>
            {group.items.map((item, index) => (
              <Link key={item.id} href={item.href} asChild>
                <Pressable testID={`more-${item.id}`} accessibilityRole="link" style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}>
                  <Lead colour={item.id === "networth" ? colors.primary : item.id in TILES ? colors.buckets[TILES[item.id] % colors.buckets.length] : null} />
                  <View style={[styles.main, index === group.items.length - 1 ? null : styles.divider]}>
                    <ThemedText numberOfLines={1} style={styles.label}>{item.label}</ThemedText>
                    <ThemedText style={styles.chevron}>›</ThemedText>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      ))}
      <Pressable testID="sign-out" accessibilityRole="button" onPress={model.signOut} style={({ pressed }) => [styles.signOut, pressed ? styles.pressed : null]}>
        <ThemedText style={styles.signOutText}>{t("auth.logout")}</ThemedText>
      </Pressable>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  section: { gap: spacing.sm },
  heading: { paddingHorizontal: spacing.xs },
  group: { backgroundColor: colors.surface, borderRadius: radius.md, borderCurve: "continuous", overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md - spacing.xs, paddingStart: spacing.md, minHeight: 48 },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm + spacing.xs, paddingEnd: spacing.md, minHeight: 48 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.separator },
  label: { flex: 1, fontSize: 16, lineHeight: 21 },
  chevron: { color: colors.tertiaryLabel, fontSize: 17 },
  pressed: { opacity: 0.6 },
  signOut: { marginTop: spacing.sm, backgroundColor: colors.fill, borderRadius: radius.md, borderCurve: "continuous", alignItems: "center", paddingVertical: spacing.sm + spacing.xs },
  signOutText: { fontSize: 17, fontWeight: "600", color: colors.destructive },
}))
