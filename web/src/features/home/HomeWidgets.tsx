import { useLiveQuery } from "dexie-react-hooks"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { useSession } from "@/api/auth"
import { formatMoney } from "@/app/money"
import { currentMonthKey } from "@/app/month"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RatesTodayCard } from "@/features/prices/RatesTodayCard"
import { useMonthView } from "@/features/plan/useMonthFigures"
import { useMetals } from "@/features/metals/useMetals"
import { useNetWorth } from "@/features/networth/useNetWorth"
import { cn } from "@/lib/utils"
import { totalsByCurrency } from "@mizan/core/db/cashAccounts"
import { useAccountsNow } from "@/features/accounts/useAccountsNow"
import { balanceOf, liveDebts, livePayments } from "@mizan/core/db/debts"
import { liveDeposits, liveGoals, savedOf } from "@mizan/core/db/goals"
import type { HomeWidget } from "@mizan/core/db/homeLayout"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { goalProjection } from "@mizan/core/domain/goal/projection"
import { pickedFrom, shownWidgets } from "@mizan/core/db/homeLayout"

interface WidgetProps {
  widget: HomeWidget
}

/** One Home card: the title, a headline figure, and in full size the detail and a way to the screen. */
function WidgetCard({ title, description, figure, negative, to, action, children, compact, tour }: {
  title: string; description?: string; figure?: string; negative?: boolean; to: string; action: string; children?: ReactNode; compact: boolean; tour?: string
}) {
  if (compact) {
    return (
      <Card data-tour={tour} className="py-3">
        <CardContent className="flex items-center justify-between gap-3">
          <Link to={to} className="font-medium hover:underline">{title}</Link>
          {figure && <span className={cn("text-xl font-semibold tabular-nums", negative && "text-destructive")}>{figure}</span>}
        </CardContent>
      </Card>
    )
  }
  return (
    <Card data-tour={tour}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {figure && <span className={cn("text-3xl font-semibold tabular-nums", negative && "text-destructive")}>{figure}</span>}
        {children}
        <Button asChild variant="outline" className="self-start"><Link to={to}>{action}</Link></Button>
      </CardContent>
    </Card>
  )
}

function Line({ label, value, negative, swatch }: { label: ReactNode; value: string; negative?: boolean; swatch?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2 truncate">{swatch && <span className="size-3 shrink-0 rounded-lg border" style={{ background: swatch }} />}{label}</span>
      <span className={cn("tabular-nums", negative && "text-destructive")}>{value}</span>
    </div>
  )
}

function useMoney() {
  const { i18n } = useTranslation()
  const session = useSession()
  const base = session?.baseCurrency ?? "IQD"
  return { base, money: (v: number, currency = base) => formatMoney(v, currency, i18n.language) }
}

function NetWorthWidget({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const worth = useNetWorth()
  const byClass = widget.options.breakdown === "classes"
  return (
    <WidgetCard tour="home-networth" compact={widget.size === "compact"} title={widget.title || t("home.netWorth")} to="/networth" action={t("home.openNetWorth")}
      figure={money(worth.current.netWorth)} negative={worth.current.netWorth < 0}
      description={byClass ? undefined : `${t("networth.assets")}: ${money(worth.current.totalAssets)} · ${t("networth.liabilities")}: ${money(worth.current.totalLiabilities)}`}>
      {byClass && worth.current.composition.filter((c) => c.amount !== 0).map((c) => <Line key={c.assetClass} label={t(`networth.classes.${c.assetClass}`)} value={money(c.amount)} />)}
    </WidgetCard>
  )
}

function PlanWidget({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const month = useMonthView(currentMonthKey(startDay), startDay)
  const figure = widget.options.figure as "free" | "spent" | "allocated"
  const total = month.figures.buckets.reduce((sum, b) => sum + b[figure], 0)
  return (
    <WidgetCard tour="home-plan" compact={widget.size === "compact"} title={widget.title || t("home.planTitle")} to="/plan" action={t("home.viewPlan")}
      figure={widget.size === "compact" ? `${money(total)} ${t(`homeLayout.options.figure.values.${figure}`)}` : undefined}
      description={`${t("home.incomePlanned")}: ${money(month.income.planned)} · ${t("home.incomeReceived")}: ${money(month.income.received)}`}>
      {month.figures.buckets.map((b) => {
        const bucket = month.buckets.find((x) => x.id === b.id)
        return <Line key={b.id} swatch={bucket?.colour} label={bucket?.name ?? "—"} value={`${money(b[figure])} ${t(`homeLayout.options.figure.values.${figure}`)}`} negative={b[figure] < 0} />
      })}
    </WidgetCard>
  )
}

function MetalsWidget({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const metals = useMetals()
  const showGain = widget.options.show === "gain"
  const total = metals.lines.reduce((acc, l) => ({ value: acc.value + l.valueNow, gain: acc.gain + l.gain }), { value: 0, gain: 0 })
  const shown = showGain ? total.gain : total.value
  return (
    <WidgetCard tour="home-metals" compact={widget.size === "compact"} title={widget.title || t("home.metalsTitle")} to="/metals" action={t("nav.metals")}
      figure={(showGain && shown > 0 ? "+" : "") + money(shown)} negative={shown < 0}
      description={metals.lines.length === 0 ? t("home.metalsNone") : showGain ? `${t("metals.valueNow")}: ${money(total.value)}` : `${t("metals.gain")}: ${money(total.gain)}`} />
  )
}

function BillsWidget({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const session = useSession()
  const startDay = session?.monthStartDay ?? 1
  const month = useMonthView(currentMonthKey(startDay), startDay)
  const upcoming = month.bills.filter((b) => !b.occurrence)
  const due = upcoming.reduce((sum, b) => sum + b.expectedAmount, 0)
  return (
    <WidgetCard tour="home-bills" compact={widget.size === "compact"} title={widget.title || t("home.upcomingBills")} to="/bills" action={t("nav.bills")}
      figure={widget.size === "compact" ? money(due) : undefined}>
      {upcoming.slice(0, Number(widget.options.count)).map((bill) => (
        <Line key={`${bill.expense.id}-${bill.dueDate}`} label={<>{bill.expense.name} <span className="text-xs opacity-70">{bill.dueDate.slice(5)}</span></>} value={money(bill.expectedAmount)} />
      ))}
      {upcoming.length === 0 && <p className="opacity-70">{t("home.noUpcoming")}</p>}
    </WidgetCard>
  )
}

function CashWidget({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const accounts = pickedFrom(widget, useAccountsNow())
  const wanted = widget.options.currency
  const totals = Object.entries(totalsByCurrency(accounts)).filter(([currency]) => wanted === "all" || currency === wanted)
  return (
    <WidgetCard compact={widget.size === "compact"} title={widget.title || t("home.cashTotal")} to="/accounts" action={accounts.length === 0 ? t("home.addAccount") : t("nav.accounts")}
      figure={widget.size === "compact" && totals[0] ? totals.map(([c, v]) => money(v, c)).join(" · ") : undefined}
      description={t("home.accounts", { count: accounts.length })}>
      {accounts.length === 0 && <p>{t("home.noAccounts")}</p>}
      {totals.map(([currency, total]) => <p key={currency} className="text-3xl font-semibold tabular-nums">{money(total, currency)}</p>)}
    </WidgetCard>
  )
}

function GoalsWidget({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const goals = useLiveQuery(liveGoals, [], [])
  const deposits = useLiveQuery(liveDeposits, [], [])
  const active = pickedFrom(widget, goals.filter((g) => g.status === "ACTIVE")).slice(0, Number(widget.options.count))
  const today = todayIso()
  const percentOf = (goal: typeof active[number]) => goalProjection(goal.targetAmount, savedOf(goal, deposits), goal.monthlyContribution, goal.targetDate, today).percent
  return (
    <WidgetCard compact={widget.size === "compact"} title={widget.title || t("nav.goals")} to="/goals" action={t("nav.goals")}
      figure={widget.size === "compact" && active[0] ? `${active[0].name} · ${percentOf(active[0])}%` : undefined}>
      {active.length === 0 && <p className="opacity-70">{t("homeLayout.noGoals")}</p>}
      {active.map((goal) => <Line key={goal.id} label={goal.name} value={`${percentOf(goal)}%`} />)}
    </WidgetCard>
  )
}

function DebtsWidget({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useMoney()
  const debts = useLiveQuery(liveDebts, [], [])
  const payments = useLiveQuery(livePayments, [], [])
  const listed = pickedFrom(widget, debts.filter((d) => d.status === "ACTIVE" && d.direction === widget.options.direction))
  return (
    <WidgetCard compact={widget.size === "compact"} title={widget.title || t(`homeLayout.options.direction.values.${widget.options.direction}`)} to="/debts" action={t("nav.debts")}
      figure={widget.size === "compact" ? listed.map((d) => money(balanceOf(d, payments), d.currency)).join(" · ") || "—" : undefined}>
      {listed.length === 0 && <p className="opacity-70">{t("homeLayout.noDebts")}</p>}
      {listed.map((debt) => <Line key={debt.id} label={debt.name} value={money(balanceOf(debt, payments), debt.currency)} />)}
    </WidgetCard>
  )
}

const RENDERERS: Record<HomeWidget["kind"], (props: WidgetProps) => ReactNode> = {
  netWorth: NetWorthWidget,
  dollar: ({ widget }) => <RatesTodayCard title={widget.title} />,
  plan: PlanWidget,
  metals: MetalsWidget,
  bills: BillsWidget,
  cash: CashWidget,
  goals: GoalsWidget,
  debts: DebtsWidget,
}

export function HomeWidgets({ layout }: { layout: HomeWidget[] }) {
  return (
    <>
      {shownWidgets(layout).map((widget) => {
        const Widget = RENDERERS[widget.kind]
        return <Widget key={widget.id} widget={widget} />
      })}
    </>
  )
}
