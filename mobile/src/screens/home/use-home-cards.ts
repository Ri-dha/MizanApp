import type { Href } from "expo-router"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { totalsByCurrency } from "@mizan/core/db/cashAccounts"
import { balanceOf, liveDebts, livePayments } from "@mizan/core/db/debts"
import { liveDeposits, liveGoals, savedOf } from "@mizan/core/db/goals"
import { pickedFrom, type HomeWidget } from "@mizan/core/db/homeLayout"
import { monthFlow } from "@mizan/core/db/monthView"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { goalProjection } from "@mizan/core/domain/goal/projection"
import { formatMoney as formatWithDigits } from "@mizan/core/domain/money/format"
import { trackedCurrencies, unitRate } from "@mizan/core/market/currency"
import { useAppMode } from "@/hooks/use-app-mode"
import { useLiveQuery, useSession } from "@/hooks/use-core"
import { useIraqi } from "@/hooks/use-currency"
import { currentMonthKey, useCashAccounts, useMonthView, useNetWorth } from "@/hooks/use-views"
import { preferences } from "@/preferences"
import { formatCount } from "@/utils/dates"
import { formatMoney } from "@/utils/money"

const MICROS = 1_000_000
const FOLLOWED_SHOWN = 4

const share = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.max(0, Math.round((part / whole) * 100))) : 0)

export interface HomeLine {
  key: string
  label: string
  value: string
  swatch?: string | null
  negative?: boolean
  /** How full the line's bar is, where the line has one (a bucket, a goal). */
  percent?: number
}

/** One Home card's content, worked out once; a template decides how a card of each kind looks. */
export interface HomeCard {
  kind: HomeWidget["kind"]
  testID: string
  title: string
  href: Href
  compact: boolean
  figure?: string
  figureNegative?: boolean
  detail?: string
  lines: HomeLine[]
  /** Shown in place of the lines when there are none. */
  empty?: string
  /** A sentence under the lines. */
  note?: string
  /** Net worth only: what is owned against what is owed. */
  split?: { assetsLabel: string; assets: string; liabilitiesLabel: string; liabilities: string; assetsPercent: number; liabilitiesPercent: number }
  /** Cash only: one total per currency. */
  totals?: string[]
}

function useMoney() {
  const { i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  return { base, money: (amount: number, currency = base) => formatMoney(amount, currency, i18n.language) }
}

function useNetWorthCard(widget: HomeWidget): HomeCard {
  const { t } = useTranslation()
  const { money } = useMoney()
  const worth = useNetWorth()
  const simple = useAppMode() === "simple"
  const { current } = worth
  const classes = widget.options.breakdown === "classes" ? current.composition.filter((c) => c.amount !== 0) : []
  // Simple mode still counts what was recorded in advanced mode, and says so, so the total never changes with the mode.
  const hiddenCounted = simple && current.composition.some((c) => c.amount !== 0 && c.assetClass !== "CASH" && c.assetClass !== "RECEIVABLES")
  return {
    kind: "netWorth", testID: "home-networth", compact: widget.size === "compact",
    title: widget.title || t("home.netWorth"), href: simple ? "/accounts" : "/networth",
    figure: money(current.netWorth), figureNegative: current.netWorth < 0,
    detail: widget.options.breakdown === "totals" ? `${t("networth.assets")}: ${money(current.totalAssets)} · ${t("networth.liabilities")}: ${money(current.totalLiabilities)}` : undefined,
    split: widget.options.breakdown === "totals"
      ? { assetsLabel: t("networth.assets"), assets: money(current.totalAssets), liabilitiesLabel: t("networth.liabilities"), liabilities: money(current.totalLiabilities), assetsPercent: share(current.totalAssets, current.totalAssets + current.totalLiabilities), liabilitiesPercent: share(current.totalLiabilities, current.totalAssets + current.totalLiabilities) }
      : undefined,
    lines: classes.map((c) => ({ key: c.assetClass, label: t(`networth.classes.${c.assetClass}`), value: money(c.amount) })),
    note: hiddenCounted ? t("appMode.includesAdvanced") : undefined,
  }
}

/** The rates card: the Baghdad dollar for people in Iraq, the first followed currencies for everyone else (ADR currency-1). */
function useDollarCard(widget: HomeWidget): HomeCard | null {
  const { t, i18n } = useTranslation()
  const iraqi = useIraqi()
  const session = useSession()
  const { metals } = useNetWorth()
  const compact = widget.size === "compact"
  if (iraqi) {
    const micros = metals.prices.usdIqdMicros
    if (micros <= 0) return null
    return {
      kind: "dollar", testID: "home-dollar", compact, title: widget.title || t("prices.dollarToday"), href: "/prices",
      // A rate, not an amount: shown in dinars even while amounts are shown in another currency.
      figure: formatWithDigits(Math.round(micros / MICROS), "IQD", i18n.language, preferences().digitStyle),
      detail: metals.prices.rateSource.label, lines: [],
    }
  }
  const base = session?.baseCurrency ?? "USD"
  const rows = trackedCurrencies(session)
    .map((code) => ({ code, rate: unitRate(code, base, metals.prices.perUsd) }))
    .filter((r): r is { code: string; rate: number } => r.rate !== null)
    .slice(0, FOLLOWED_SHOWN)
  if (rows.length === 0) return null
  const number = (v: number) => formatCount(v, i18n.language, v >= 100 ? { maximumFractionDigits: 0 } : v >= 1 ? { maximumFractionDigits: 2 } : { maximumSignificantDigits: 4 })
  return {
    kind: "dollar", testID: "home-rates", compact, title: widget.title || t("worldRates.today", { base }), href: "/prices",
    figure: compact ? `1 ${rows[0].code} = ${number(rows[0].rate)} ${base}` : undefined,
    lines: compact ? [] : rows.map((r) => ({ key: r.code, label: `1 ${r.code}`, value: `${number(r.rate)} ${base}` })),
  }
}

function useMonthCard(widget: HomeWidget): HomeCard {
  const { t } = useTranslation()
  const { money } = useMoney()
  const startDay = useSession()?.monthStartDay ?? 1
  const flow = monthFlow(useMonthView(currentMonthKey(startDay), startDay))
  return {
    kind: "month", testID: "home-month", compact: widget.size === "compact", title: widget.title || t("home.monthTitle"), href: "/report",
    figure: `${money(flow.left)} ${t("home.monthLeft")}`,
    lines: [
      { key: "received", label: t("home.monthReceived"), value: money(flow.received) },
      { key: "spent", label: t("home.monthSpent"), value: money(flow.spent) },
    ],
  }
}

function usePlanCard(widget: HomeWidget): HomeCard {
  const { t } = useTranslation()
  const { money } = useMoney()
  const startDay = useSession()?.monthStartDay ?? 1
  const month = useMonthView(currentMonthKey(startDay), startDay)
  const figure = widget.options.figure as "free" | "spent" | "allocated"
  const word = t(`homeLayout.options.figure.values.${figure}`)
  const compact = widget.size === "compact"
  const total = month.figures.buckets.reduce((sum, b) => sum + b[figure], 0)
  return {
    kind: "plan", testID: "home-plan", compact, title: widget.title || t("home.planTitle"), href: "/plan",
    figure: compact ? `${money(total)} ${word}` : undefined,
    detail: `${t("home.incomePlanned")}: ${money(month.income.planned)} · ${t("home.incomeReceived")}: ${money(month.income.received)}`,
    lines: month.figures.buckets.map((b) => {
      const bucket = month.buckets.find((x) => x.id === b.id)
      return {
        key: b.id, label: bucket?.name ?? "—", swatch: bucket?.colour ?? null, value: `${money(b[figure])} ${word}`, negative: b[figure] < 0,
        percent: b.free < 0 ? 100 : share(b.allocated - b.free, b.allocated),
      }
    }),
    empty: t("plan.noBuckets"),
  }
}

function useMetalsCard(widget: HomeWidget): HomeCard {
  const { t } = useTranslation()
  const { money } = useMoney()
  const { metals } = useNetWorth()
  const total = metals.lines.reduce((acc, l) => ({ value: acc.value + l.valueNow, gain: acc.gain + l.gain }), { value: 0, gain: 0 })
  const showGain = widget.options.show === "gain"
  const shown = showGain ? total.gain : total.value
  return {
    kind: "metals", testID: "home-metals", compact: widget.size === "compact", title: widget.title || t("home.metalsTitle"), href: "/metals",
    figure: (showGain && shown > 0 ? "+" : "") + money(shown), figureNegative: shown < 0,
    detail: metals.lines.length === 0 ? t("home.metalsNone") : showGain ? `${t("metals.valueNow")}: ${money(total.value)}` : `${t("metals.gain")}: ${money(total.gain)}`,
    lines: [],
  }
}

function useBillsCard(widget: HomeWidget): HomeCard {
  const { t } = useTranslation()
  const { money } = useMoney()
  const startDay = useSession()?.monthStartDay ?? 1
  const month = useMonthView(currentMonthKey(startDay), startDay)
  const upcoming = month.bills.filter((b) => !b.occurrence)
  const compact = widget.size === "compact"
  return {
    kind: "bills", testID: "home-bills", compact, title: widget.title || t("home.upcomingBills"), href: "/bills",
    figure: compact ? money(upcoming.reduce((s, b) => s + b.expectedAmount, 0)) : undefined,
    lines: upcoming.slice(0, Number(widget.options.count)).map((bill) => ({
      key: `${bill.expense.id}-${bill.dueDate}`, label: `${bill.expense.name} · ${bill.dueDate.slice(5)}`, value: money(bill.expectedAmount),
    })),
    empty: t("home.noUpcoming"),
  }
}

function useCashCard(widget: HomeWidget): HomeCard {
  const { t } = useTranslation()
  const { money } = useMoney()
  const accounts = pickedFrom(widget, useCashAccounts())
  const wanted = widget.options.currency
  const totals = Object.entries(totalsByCurrency(accounts)).filter(([currency]) => wanted === "all" || currency === wanted).map(([c, v]) => money(v, c))
  const compact = widget.size === "compact"
  return {
    kind: "cash", testID: "home-cash", compact, title: widget.title || t("home.cashTotal"), href: "/accounts",
    figure: compact ? totals.join(" · ") || "—" : undefined,
    detail: t("home.accounts", { count: accounts.length }),
    totals, lines: [], empty: totals.length === 0 ? t("home.noAccounts") : undefined,
  }
}

function useGoalsCard(widget: HomeWidget): HomeCard {
  const { t } = useTranslation()
  const goals = useLiveQuery(liveGoals, [], [])
  const deposits = useLiveQuery(liveDeposits, [], [])
  const today = todayIso()
  const active = pickedFrom(widget, goals.filter((g) => g.status === "ACTIVE")).slice(0, Number(widget.options.count))
  const percent = (goal: (typeof active)[number]) => goalProjection(goal.targetAmount, savedOf(goal, deposits), goal.monthlyContribution, goal.targetDate, today).percent
  const compact = widget.size === "compact"
  return {
    kind: "goals", testID: "home-goals", compact, title: widget.title || t("nav.goals"), href: "/goals",
    figure: compact && active[0] ? `${active[0].name} · ${percent(active[0])}%` : undefined,
    lines: active.map((goal) => ({ key: goal.id, label: goal.name, value: `${percent(goal)}%`, percent: Math.min(100, Math.max(0, percent(goal))) })),
    empty: t("homeLayout.noGoals"),
  }
}

function useDebtsCard(widget: HomeWidget): HomeCard {
  const { t } = useTranslation()
  const { money } = useMoney()
  const debts = useLiveQuery(liveDebts, [], [])
  const payments = useLiveQuery(livePayments, [], [])
  const listed = pickedFrom(widget, debts.filter((d) => d.status === "ACTIVE" && d.direction === widget.options.direction))
  const compact = widget.size === "compact"
  return {
    kind: "debts", testID: "home-debts", compact, title: widget.title || t(`homeLayout.options.direction.values.${widget.options.direction}`), href: "/debts",
    figure: compact ? listed.map((d) => money(balanceOf(d, payments), d.currency)).join(" · ") || "—" : undefined,
    lines: listed.map((debt) => ({ key: debt.id, label: debt.name, value: money(balanceOf(debt, payments), debt.currency) })),
    empty: t("homeLayout.noDebts"),
  }
}

type CardProps = { widget: HomeWidget; render: (card: HomeCard) => ReactNode }

/** Each kind reads different data, so each is its own component; `render` is the template's drawing of the card. */
const cardOf = (useCard: (widget: HomeWidget) => HomeCard | null) =>
  function HomeCardData({ widget, render }: CardProps) {
    const card = useCard(widget)
    return card ? render(card) : null
  }

export const HOME_CARDS: Record<HomeWidget["kind"], (props: CardProps) => ReactNode> = {
  netWorth: cardOf(useNetWorthCard), month: cardOf(useMonthCard), dollar: cardOf(useDollarCard), plan: cardOf(usePlanCard), metals: cardOf(useMetalsCard),
  bills: cardOf(useBillsCard), cash: cardOf(useCashCard), goals: cardOf(useGoalsCard), debts: cardOf(useDebtsCard),
}
