import { Link } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import type { HomeWidget } from "@mizan/core/db/homeLayout"
import { Announcements } from "@/components/announcements"
import { AwaitingKey } from "@/components/awaiting-key"
import { LinkRow } from "@/components/link-row"
import { Notice } from "@/components/notice"
import { Group } from "@/components/row"
import { ShownCurrencyBadge } from "@/components/shown-currency"
import { SectionTitle, Card as SoftCard } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import { HOME_CARDS, type HomeCard, type HomeLine } from "../use-home-cards"
import type { HomeScreenModel } from "../use-home-screen"

const TONES: Partial<Record<HomeWidget["kind"], "hero" | "gold">> = { netWorth: "hero", metals: "gold" }

/** Compact cards sit two to a line, so neighbours are drawn as one line of tiles. */
function inLines(widgets: HomeWidget[]): HomeWidget[][] {
  const lines: HomeWidget[][] = []
  for (const widget of widgets) {
    const last = lines[lines.length - 1]
    if (widget.size === "compact" && last?.[0].size === "compact") last.push(widget)
    else lines.push([widget])
  }
  return lines
}

/** Soft: a headline net-worth card, small tiles side by side, then one card per subject with its rows and bars. */
export function HomeSoft({ model }: { model: HomeScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      {model.verifyNotice ? (
        <Link href="/verify" asChild>
          <Pressable testID="open-verify" accessibilityRole="link"><Notice>{model.verifyNotice}</Notice></Pressable>
        </Link>
      ) : null}
      <AwaitingKey />
      <ShownCurrencyBadge />
      <Announcements />
      {model.staleNotice ? (
        <Link href="/assets" asChild>
          <Pressable testID="open-stale-assets" accessibilityRole="link"><Notice>{model.staleNotice}</Notice></Pressable>
        </Link>
      ) : null}
      {inLines(model.widgets).map((line) => {
        const cards = line.map((widget) => {
          const Data = HOME_CARDS[widget.kind]
          return <Data key={widget.id} widget={widget} render={(card) => (card.compact ? <Tile card={card} /> : <Card card={card} />)} />
        })
        return line[0].size === "compact" ? <View key={line[0].id} style={styles.tiles}>{cards}</View> : cards
      })}
      <Group>
        <LinkRow testID="customise-home" href="/home-layout" last><ThemedText>{t("homeLayout.customise")}</ThemedText></LinkRow>
      </Group>
    </>
  )
}

function Tile({ card }: { card: HomeCard }) {
  const styles = useStyles()
  const tone = TONES[card.kind]
  return (
    <Link href={card.href} asChild>
      <Pressable testID={card.testID} accessibilityRole="link" style={styles.tile}>
        <SoftCard tone={tone === "gold" ? "gold" : undefined} style={styles.tileCard}>
          <SectionTitle tone={tone === "gold" ? "gold" : undefined}>{card.title}</SectionTitle>
          {card.figure ? (
            <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={[styles.tileFigure, card.figureNegative ? styles.negative : null]}>{card.figure}</ThemedText>
          ) : null}
          {card.detail ? <ThemedText numberOfLines={2} style={styles.meta}>{card.detail}</ThemedText> : null}
        </SoftCard>
      </Pressable>
    </Link>
  )
}

function Card({ card }: { card: HomeCard }) {
  const styles = useStyles()
  const tone = TONES[card.kind]
  const hero = tone === "hero"
  const gain = card.kind === "metals" && card.figure?.startsWith("+")
  const bars = card.lines.some((line) => line.percent !== undefined)
  return (
    <Link href={card.href} asChild>
      <Pressable testID={card.testID} accessibilityRole="link" style={({ pressed }) => (pressed ? styles.pressed : null)}>
        <SoftCard tone={tone}>
          <View style={styles.header}>
            <SectionTitle tone={tone}>{card.title}</SectionTitle>
            <ThemedText style={[styles.chevron, hero ? styles.onHeroMuted : null]}>›</ThemedText>
          </View>
          {card.figure ? (
            <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}
              style={[hero ? styles.heroFigure : styles.figure, hero ? styles.onHero : null, gain ? styles.positive : null, card.figureNegative ? styles.negative : null]}>
              {card.figure}
            </ThemedText>
          ) : null}
          {card.split ? (
            <>
              <View style={styles.thickBar}>
                <View style={[styles.assets, { width: `${card.split.assetsPercent}%` }]} />
                <View style={[styles.liabilities, { width: `${card.split.liabilitiesPercent}%` }]} />
              </View>
              <Pair label={card.split.assetsLabel} value={card.split.assets} hero={hero} />
              <Pair label={card.split.liabilitiesLabel} value={card.split.liabilities} hero={hero} />
            </>
          ) : card.detail ? <ThemedText style={[styles.meta, hero ? styles.onHeroMuted : null]}>{card.detail}</ThemedText> : null}
          {card.totals?.map((total) => <ThemedText key={total} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={styles.figure}>{total}</ThemedText>)}
          {card.lines.map((line) => (bars ? <BarLine key={line.key} line={line} /> : <Pair key={line.key} label={line.label} value={line.value} negative={line.negative} hero={hero} />))}
          {card.lines.length === 0 && !card.totals?.length && card.empty ? <ThemedText style={styles.meta}>{card.empty}</ThemedText> : null}
          {card.note ? <ThemedText style={[styles.meta, hero ? styles.onHeroMuted : null]}>{card.note}</ThemedText> : null}
        </SoftCard>
      </Pressable>
    </Link>
  )
}

function Pair({ label, value, negative, hero }: { label: string; value: string; negative?: boolean; hero?: boolean }) {
  const styles = useStyles()
  return (
    <View style={styles.pair}>
      <ThemedText numberOfLines={1} style={[styles.pairLabel, hero ? styles.onHeroMuted : null]}>{label}</ThemedText>
      <ThemedText style={[styles.pairValue, hero ? styles.onHero : null, negative ? styles.negative : null]}>{value}</ThemedText>
    </View>
  )
}

function BarLine({ line }: { line: HomeLine }) {
  const styles = useStyles()
  return (
    <View style={styles.barLine}>
      <View style={styles.pair}>
        <View style={styles.name}>
          {line.swatch ? <View style={[styles.dot, { backgroundColor: line.swatch }]} /> : null}
          <ThemedText numberOfLines={1} style={styles.lineLabel}>{line.label}</ThemedText>
        </View>
        <ThemedText style={[styles.pairValue, line.negative ? styles.negative : null]}>{line.value}</ThemedText>
      </View>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${line.percent ?? 0}%` }, line.swatch ? { backgroundColor: line.swatch } : null, line.negative ? styles.barOver : null]} />
      </View>
    </View>
  )
}

const useStyles = makeStyles((colors) => ({
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm + spacing.xs },
  tile: { flexGrow: 1, flexBasis: "45%" },
  tileCard: { flex: 1, gap: spacing.xs, padding: spacing.md - 2 },
  tileFigure: { fontSize: 22, lineHeight: 28, fontWeight: "600", fontVariant: ["tabular-nums"] },
  pressed: { opacity: 0.7 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  chevron: { color: colors.tertiaryLabel, fontSize: 17 },
  heroFigure: { fontSize: 34, lineHeight: 40, fontWeight: "700", fontVariant: ["tabular-nums"] },
  figure: { fontSize: 26, lineHeight: 32, fontWeight: "600", fontVariant: ["tabular-nums"] },
  onHero: { color: colors.onHero },
  onHeroMuted: { color: colors.heroMuted },
  positive: { color: colors.success },
  negative: { color: colors.destructive },
  meta: { fontSize: 13, lineHeight: 18, color: colors.tertiaryLabel },
  thickBar: { flexDirection: "row", height: spacing.sm, borderRadius: spacing.xs, overflow: "hidden", backgroundColor: colors.fill },
  assets: { backgroundColor: colors.chart[0] },
  liabilities: { backgroundColor: colors.chart[1] },
  pair: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md - spacing.xs },
  pairLabel: { fontSize: 14, lineHeight: 20, color: colors.tertiaryLabel, flexShrink: 1 },
  pairValue: { fontSize: 15, lineHeight: 20, fontWeight: "500", fontVariant: ["tabular-nums"] },
  barLine: { gap: 6 },
  name: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  lineLabel: { fontSize: 15, flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: radius.full },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.fill, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  barOver: { backgroundColor: colors.destructive },
}))
