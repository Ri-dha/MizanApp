import { useCashAccounts } from "@/hooks/use-views"
import { Link, type Href } from "expo-router"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View, type ColorValue } from "react-native"

import { totalsByCurrency } from "@mizan/core/db/cashAccounts"
import { balanceOf, liveDebts, livePayments } from "@mizan/core/db/debts"
import { liveDeposits, liveGoals, savedOf } from "@mizan/core/db/goals"
import type { HomeWidget } from "@mizan/core/db/homeLayout"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { goalProjection } from "@mizan/core/domain/goal/projection"
import { formatMoney as formatWithDigits } from "@mizan/core/domain/money/format"
import { trackedCurrencies, unitRate } from "@mizan/core/market/currency"
import { formatMoney } from "@/utils/money"
import { formatCount } from "@/utils/dates"
import { preferences } from "@/preferences"
import { useIraqi } from "@/hooks/use-currency"
import { Group, Row } from "@/components/row"
import { ThemedText } from "@/components/themed-text"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { currentMonthKey, useMonthView, useNetWorth } from "@/hooks/use-views"
import { colors, radius, spacing, type, useBrandColors } from "@/theme"
import { pickedFrom, shownWidgets } from "@mizan/core/db/homeLayout"
import { monthFlow } from "@mizan/core/db/monthView"

const MICROS = 1_000_000

interface WidgetProps {
  widget: HomeWidget
}

function useMoney() {
  const { i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  return { base, money: (amount: number, currency = base) => formatMoney(amount, currency, i18n.language) }
}

function useNegative() {
  const brand = useBrandColors()
  return (amount: number) => (amount < 0 ? { color: brand.destructive } : null)
}

/** A card that opens its screen: compact is one line with the figure; full adds the detail rows. */
function Card({ title, detail, figure, figureNegative, href, compact, testID, children }: {
  title: string; detail?: string; figure?: string; figureNegative?: boolean; href: Href; compact: boolean; testID: string; children?: ReactNode
}) {
  const brand = useBrandColors()
  const negative = useNegative()
  const figureStyle = figureNegative ? negative(-1) : null
  if (compact) {
    return (
      <Group>
        <Link href={href} asChild>
          <Pressable testID={testID} accessibilityRole="link">
            <Row last trailing={figure ? <ThemedText style={[type.amount, styles.figure, figureStyle]}>{figure}</ThemedText> : undefined}>
              <ThemedText variant="headline">{title}</ThemedText>
            </Row>
          </Pressable>
        </Link>
      </Group>
    )
  }
  return (
    <View style={styles.section}>
      <Link href={href} asChild>
        <Pressable testID={testID} accessibilityRole="link" style={styles.header}>
          <ThemedText variant="headline">{title}</ThemedText>
          <ThemedText style={{ color: brand.primary }}>›</ThemedText>
        </Pressable>
      </Link>
      {detail ? <ThemedText variant="subhead">{detail}</ThemedText> : null}
      <Group>
        {figure ? <Row last={!children}><ThemedText style={[type.largeTitle, styles.figure, figureStyle]}>{figure}</ThemedText></Row> : null}
        {children}
      </Group>
    </View>
  )
}

function Line({ label, value, swatch, negative, last }: { label: string; value: string; swatch?: ColorValue; negative?: boolean; last?: boolean }) {
  const red = useNegative()
  return (
    <Row last={last} trailing={<ThemedText style={[type.amount, styles.figure, negative ? red(-1) : null]}>{value}</ThemedText>}>
      <View style={styles.label}>
        {swatch ? <View style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
        <ThemedText numberOfLines={1}>{label}</ThemedText>
      </View>
    </Row>
  )
}

function Empty({ text }: { text: string }) {
  return <Row last><ThemedText variant="subhead">{text}</ThemedText></Row>
}

function NetWorthCard({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const worth = useNetWorth()
  const classes = widget.options.breakdown === "classes" ? worth.current.composition.filter((c) => c.amount !== 0) : []
  return (
    <Card testID="home-networth" compact={widget.size === "compact"} title={widget.title || t("home.netWorth")} href="/networth"
      figure={money(worth.current.netWorth)} figureNegative={worth.current.netWorth < 0}
      detail={widget.options.breakdown === "totals" ? `${t("networth.assets")}: ${money(worth.current.totalAssets)} · ${t("networth.liabilities")}: ${money(worth.current.totalLiabilities)}` : undefined}>
      {classes.length > 0 ? classes.map((c, i) => <Line key={c.assetClass} label={t(`networth.classes.${c.assetClass}`)} value={money(c.amount)} last={i === classes.length - 1} />) : undefined}
    </Card>
  )
}

/** The rates card: the Baghdad dollar for people in Iraq, the first followed currencies for everyone else (ADR currency-1). */
function DollarCard({ widget }: WidgetProps) {
  return useIraqi() ? <BaghdadDollarCard widget={widget} /> : <FollowedRatesCard widget={widget} />
}

function BaghdadDollarCard({ widget }: WidgetProps) {
  const { t, i18n } = useTranslation()
  const worth = useNetWorth()
  const micros = worth.metals.prices.usdIqdMicros
  if (micros <= 0) return null
  // A rate, not an amount: shown in dinars even while amounts are shown in another currency.
  const figure = formatWithDigits(Math.round(micros / MICROS), "IQD", i18n.language, preferences().digitStyle)
  return (
    <Card testID="home-dollar" compact={widget.size === "compact"} title={widget.title || t("prices.dollarToday")} href="/prices"
      figure={figure} detail={worth.metals.prices.rateSource.label} />
  )
}

const FOLLOWED_SHOWN = 4

function FollowedRatesCard({ widget }: WidgetProps) {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const { metals } = useNetWorth()
  const base = session?.baseCurrency ?? "USD"
  const rows = trackedCurrencies(session)
    .map((code) => ({ code, rate: unitRate(code, base, metals.prices.perUsd) }))
    .filter((r): r is { code: string; rate: number } => r.rate !== null)
    .slice(0, FOLLOWED_SHOWN)
  if (rows.length === 0) return null
  const number = (v: number) => formatCount(v, i18n.language, v >= 100 ? { maximumFractionDigits: 0 } : v >= 1 ? { maximumFractionDigits: 2 } : { maximumSignificantDigits: 4 })
  const first = rows[0]
  return (
    <Card testID="home-rates" compact={widget.size === "compact"} title={widget.title || t("worldRates.today", { base })} href="/prices"
      figure={widget.size === "compact" ? `1 ${first.code} = ${number(first.rate)} ${base}` : undefined}>
      {widget.size === "compact" ? null : rows.map((r, i) => <Line key={r.code} label={`1 ${r.code}`} value={`${number(r.rate)} ${base}`} last={i === rows.length - 1} />)}
    </Card>
  )
}

function MonthCard({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const startDay = useSession()?.monthStartDay ?? 1
  const flow = monthFlow(useMonthView(currentMonthKey(startDay), startDay))
  return (
    <Card testID="home-month" compact={widget.size === "compact"} title={widget.title || t("home.monthTitle")} href="/report"
      figure={`${money(flow.left)} ${t("home.monthLeft")}`}>
      <Line label={t("home.monthReceived")} value={money(flow.received)} />
      <Line label={t("home.monthSpent")} value={money(flow.spent)} last />
    </Card>
  )
}

function PlanCard({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const month = useMonthView(currentMonthKey(startDay), startDay)
  const figure = widget.options.figure as "free" | "spent" | "allocated"
  const word = t(`homeLayout.options.figure.values.${figure}`)
  const total = month.figures.buckets.reduce((sum, b) => sum + b[figure], 0)
  return (
    <Card testID="home-plan" compact={widget.size === "compact"} title={widget.title || t("home.planTitle")} href="/plan"
      figure={widget.size === "compact" ? `${money(total)} ${word}` : undefined}
      detail={`${t("home.incomePlanned")}: ${money(month.income.planned)} · ${t("home.incomeReceived")}: ${money(month.income.received)}`}>
      {month.figures.buckets.length === 0 ? <Empty text={t("plan.noBuckets")} /> : month.figures.buckets.map((b, i) => {
        const bucket = month.buckets.find((x) => x.id === b.id)
        return <Line key={b.id} label={bucket?.name ?? "—"} swatch={bucket?.colour ?? colors.fill} value={`${money(b[figure])} ${word}`} negative={b[figure] < 0} last={i === month.figures.buckets.length - 1} />
      })}
    </Card>
  )
}

function MetalsCard({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const { metals } = useNetWorth()
  const total = metals.lines.reduce((acc, l) => ({ value: acc.value + l.valueNow, gain: acc.gain + l.gain }), { value: 0, gain: 0 })
  const showGain = widget.options.show === "gain"
  const shown = showGain ? total.gain : total.value
  return (
    <Card testID="home-metals" compact={widget.size === "compact"} title={widget.title || t("home.metalsTitle")} href="/metals"
      figure={(showGain && shown > 0 ? "+" : "") + money(shown)} figureNegative={shown < 0}
      detail={metals.lines.length === 0 ? t("home.metalsNone") : showGain ? `${t("metals.valueNow")}: ${money(total.value)}` : `${t("metals.gain")}: ${money(total.gain)}`} />
  )
}

function BillsCard({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const month = useMonthView(currentMonthKey(startDay), startDay)
  const upcoming = month.bills.filter((b) => !b.occurrence)
  const shown = upcoming.slice(0, Number(widget.options.count))
  return (
    <Card testID="home-bills" compact={widget.size === "compact"} title={widget.title || t("home.upcomingBills")} href="/bills"
      figure={widget.size === "compact" ? money(upcoming.reduce((s, b) => s + b.expectedAmount, 0)) : undefined}>
      {shown.length === 0 ? <Empty text={t("home.noUpcoming")} /> : shown.map((bill, i) => (
        <Line key={`${bill.expense.id}-${bill.dueDate}`} label={`${bill.expense.name} · ${bill.dueDate.slice(5)}`} value={money(bill.expectedAmount)} last={i === shown.length - 1} />
      ))}
    </Card>
  )
}

function CashCard({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const accounts = pickedFrom(widget, useCashAccounts())
  const wanted = widget.options.currency
  const totals = Object.entries(totalsByCurrency(accounts)).filter(([currency]) => wanted === "all" || currency === wanted)
  return (
    <Card testID="home-cash" compact={widget.size === "compact"} title={widget.title || t("home.cashTotal")} href="/accounts"
      figure={widget.size === "compact" ? totals.map(([c, v]) => money(v, c)).join(" · ") || "—" : undefined}
      detail={t("home.accounts", { count: accounts.length })}>
      {totals.length === 0 ? <Empty text={t("home.noAccounts")} /> : totals.map(([currency, total], i) => (
        <Row key={currency} last={i === totals.length - 1}><ThemedText style={[type.title, styles.figure]}>{money(total, currency)}</ThemedText></Row>
      ))}
    </Card>
  )
}

function GoalsCard({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const goals = useLiveQuery(liveGoals, [], [])
  const deposits = useLiveQuery(liveDeposits, [], [])
  const today = todayIso()
  const active = pickedFrom(widget, goals.filter((g) => g.status === "ACTIVE")).slice(0, Number(widget.options.count))
  const percent = (goal: (typeof active)[number]) => goalProjection(goal.targetAmount, savedOf(goal, deposits), goal.monthlyContribution, goal.targetDate, today).percent
  return (
    <Card testID="home-goals" compact={widget.size === "compact"} title={widget.title || t("nav.goals")} href="/goals"
      figure={widget.size === "compact" && active[0] ? `${active[0].name} · ${percent(active[0])}%` : undefined}>
      {active.length === 0 ? <Empty text={t("homeLayout.noGoals")} /> : active.map((goal, i) => <Line key={goal.id} label={goal.name} value={`${percent(goal)}%`} last={i === active.length - 1} />)}
    </Card>
  )
}

function DebtsCard({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const debts = useLiveQuery(liveDebts, [], [])
  const payments = useLiveQuery(livePayments, [], [])
  const listed = pickedFrom(widget, debts.filter((d) => d.status === "ACTIVE" && d.direction === widget.options.direction))
  return (
    <Card testID="home-debts" compact={widget.size === "compact"} title={widget.title || t(`homeLayout.options.direction.values.${widget.options.direction}`)} href="/debts"
      figure={widget.size === "compact" ? listed.map((d) => money(balanceOf(d, payments), d.currency)).join(" · ") || "—" : undefined}>
      {listed.length === 0 ? <Empty text={t("homeLayout.noDebts")} /> : listed.map((debt, i) => <Line key={debt.id} label={debt.name} value={money(balanceOf(debt, payments), debt.currency)} last={i === listed.length - 1} />)}
    </Card>
  )
}

const CARDS: Record<HomeWidget["kind"], (props: WidgetProps) => ReactNode> = {
  netWorth: NetWorthCard, month: MonthCard, dollar: DollarCard, plan: PlanCard, metals: MetalsCard,
  bills: BillsCard, cash: CashCard, goals: GoalsCard, debts: DebtsCard,
}

export function HomeCards({ layout }: { layout: HomeWidget[] }) {
  return (
    <>
      {shownWidgets(layout).map((widget) => {
        const Widget = CARDS[widget.kind]
        return <Widget key={widget.id} widget={widget} />
      })}
    </>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs },
  figure: { fontVariant: ["tabular-nums"] },
  label: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  swatch: { width: spacing.md - spacing.xs, height: spacing.md - spacing.xs, borderRadius: radius.sm / 2 },
})
