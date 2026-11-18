import { Link, Stack, type Href } from "expo-router"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { totalsByCurrency } from "@mizan/core/db/cashAccounts"
import { formatMoney } from "@mizan/core/domain/money/format"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { Notice } from "@/components/notice"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { currentMonthKey, useCashAccounts, useMonthView, useNetWorth } from "@/hooks/use-views"
import { colors, radius, spacing, type, useBrandColors } from "@/theme"

const MICROS = 1_000_000
const BILLS_SHOWN = 5

/** A titled group whose header leads to the full screen. */
function Section({ title, detail, href, children, testID }: { title: string; detail?: string; href?: Href; children: ReactNode; testID?: string }) {
  const brand = useBrandColors()
  const header = (
    <View testID={testID} style={styles.sectionHeader}>
      <ThemedText variant="headline">{title}</ThemedText>
      {href ? <ThemedText style={{ color: brand.primary }}>›</ThemedText> : null}
    </View>
  )
  return (
    <View style={styles.section}>
      {href ? (
        <Link href={href} asChild>
          <Pressable accessibilityRole="link">{header}</Pressable>
        </Link>
      ) : header}
      {detail ? <ThemedText variant="subhead">{detail}</ThemedText> : null}
      <Group>{children}</Group>
    </View>
  )
}

export function Home() {
  const { t, i18n } = useTranslation()
  const brand = useBrandColors()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  const startDay = session?.monthStartDay ?? 1
  const month = useMonthView(currentMonthKey(startDay), startDay)
  const worth = useNetWorth()
  const accounts = useCashAccounts()
  const money = (amount: number, currency = base) => formatMoney(amount, currency, i18n.language)
  const signed = (amount: number) => (amount < 0 ? { color: brand.destructive } : null)
  const metalTotals = worth.metals.lines.reduce((acc, line) => ({ value: acc.value + line.valueNow, gain: acc.gain + line.gain }), { value: 0, gain: 0 })
  const upcoming = month.bills.filter((bill) => !bill.occurrence).slice(0, BILLS_SHOWN)
  const dollar = worth.metals.prices.usdIqdMicros > 0 ? Math.round(worth.metals.prices.usdIqdMicros / MICROS) : null

  return (
    <Screen>
      <Stack.Screen options={{ title: t("home.greeting", { name: session?.displayName ?? "" }) }} />
      {session && !session.verified ? (
        <Link href="/verify" asChild>
          <Pressable testID="open-verify" accessibilityRole="link">
            <Notice>{`${t("auth.verifyTitle")} · ${t("auth.verify")}`}</Notice>
          </Pressable>
        </Link>
      ) : null}

      <Section testID="home-networth" title={t("home.netWorth")} detail={`${t("networth.assets")}: ${money(worth.current.totalAssets)} · ${t("networth.liabilities")}: ${money(worth.current.totalLiabilities)}`}>
        <Row last>
          <ThemedText testID="net-worth" style={[type.largeTitle, styles.figure, signed(worth.current.netWorth)]}>{money(worth.current.netWorth)}</ThemedText>
        </Row>
      </Section>

      {dollar !== null ? (
        <Group>
          <Row last trailing={<ThemedText style={type.amount}>{money(dollar, "IQD")}</ThemedText>}>
            <ThemedText>{t("prices.dollarToday")}</ThemedText>
            <ThemedText variant="caption">{worth.metals.prices.rateSource.label}</ThemedText>
          </Row>
        </Group>
      ) : null}

      <Section testID="home-plan" title={t("home.planTitle")} href="/plan" detail={`${t("home.incomePlanned")}: ${money(month.income.planned)} · ${t("home.incomeReceived")}: ${money(month.income.received)}`}>
        {month.figures.buckets.map((figure, index) => {
          const bucket = month.buckets.find((b) => b.id === figure.id)
          return (
            <Row
              key={figure.id}
              last={index === month.figures.buckets.length - 1}
              trailing={<ThemedText style={[type.amount, signed(figure.free)]}>{`${money(figure.free)} ${t("home.free")}`}</ThemedText>}
            >
              <View style={styles.bucket}>
                <View style={[styles.swatch, { backgroundColor: bucket?.colour ?? colors.fill }]} />
                <ThemedText>{bucket?.name ?? "—"}</ThemedText>
              </View>
            </Row>
          )
        })}
      </Section>

      <Section testID="home-metals" title={t("home.metalsTitle")} detail={worth.metals.lines.length === 0 ? t("home.metalsNone") : `${t("metals.valueNow")}: ${money(metalTotals.value)}`}>
        <Row last>
          <ThemedText style={[type.title, styles.figure, signed(metalTotals.gain)]}>{(metalTotals.gain > 0 ? "+" : "") + money(metalTotals.gain)}</ThemedText>
        </Row>
      </Section>

      <Section testID="home-bills" title={t("home.upcomingBills")}>
        {upcoming.length === 0 ? (
          <Row last><ThemedText variant="subhead">{t("home.noUpcoming")}</ThemedText></Row>
        ) : (
          upcoming.map((bill, index) => (
            <Row key={`${bill.expense.id}-${bill.dueDate}`} last={index === upcoming.length - 1} trailing={<ThemedText style={type.amount}>{money(bill.expectedAmount)}</ThemedText>}>
              <ThemedText>{bill.expense.name}</ThemedText>
              <ThemedText variant="caption">{bill.dueDate}</ThemedText>
            </Row>
          ))
        )}
      </Section>

      <Section testID="home-cash" title={t("home.cashTotal")} detail={t("home.accounts", { count: accounts.length })}>
        {accounts.length === 0 ? (
          <Row last><ThemedText variant="subhead">{t("home.noAccounts")}</ThemedText></Row>
        ) : (
          Object.entries(totalsByCurrency(accounts)).map(([currency, total], index, all) => (
            <Row key={currency} last={index === all.length - 1}>
              <ThemedText style={[type.title, styles.figure]}>{money(total, currency)}</ThemedText>
            </Row>
          ))
        )}
      </Section>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs },
  figure: { fontVariant: ["tabular-nums"] },
  bucket: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  swatch: { width: spacing.md - spacing.xs, height: spacing.md - spacing.xs, borderRadius: radius.sm / 2 },
})
