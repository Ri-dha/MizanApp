import { ChevronRight, Download, Gem, Info, KeyRound, TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { useDateFormat } from "@/app/dates"
import { HelpButton } from "@/components/HelpButton"
import { InstallButton } from "@/components/InstallButton"
import { Button } from "@/components/ui/button"
import { RatesTodayCard } from "@/features/prices/RatesTodayCard"
import { cn } from "@/lib/utils"
import type { HomeWidget } from "@mizan/core/db/homeLayout"
import type { HomePageModel } from "../useHomePage"
import { useBillsWidget, useCashWidget, useDebtsWidget, useGoalsWidget, useHomeMoney, useMetalsWidget, useMonthWidget, useNetWorthWidget, usePlanWidget } from "../useHomeWidgets"

interface WidgetProps {
  widget: HomeWidget
}

const SHARE_COLOURS = ["bg-bucket-1", "bg-bucket-2", "bg-bucket-3", "bg-bucket-4", "bg-bucket-5", "bg-bucket-6", "bg-bucket-7", "bg-bucket-8"]

/** A full card takes the width the Soft grid gives its kind; a compact one is always a third. */
const SPAN: Record<HomeWidget["kind"], string> = {
  netWorth: "lg:col-span-7",
  month: "lg:col-span-5",
  dollar: "lg:col-span-4",
  plan: "lg:col-span-8",
  metals: "lg:col-span-4",
  bills: "lg:col-span-4",
  cash: "lg:col-span-4",
  goals: "lg:col-span-4",
  debts: "lg:col-span-4",
}

function Tile({ widget, title, aside, tour, tone, children }: { widget: HomeWidget; title: ReactNode; aside?: ReactNode; tour?: string; tone?: "hero" | "gold"; children?: ReactNode }) {
  return (
    <section data-tour={tour} className={cn(
      "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card",
      widget.size === "compact" ? "lg:col-span-4" : SPAN[widget.kind],
      tone === "hero" && "border-transparent shadow-sheet",
      tone === "gold" && "border-gold/40 bg-gold-soft shadow-none",
    )}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={cn("flex items-center gap-1.5 font-sans text-[13px] font-semibold text-muted-foreground", tone === "gold" && "text-gold")}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Go({ to, children }: { to: string; children: ReactNode }) {
  return <Button asChild variant="ghost" size="sm" className="-me-2 text-link"><Link to={to}>{children}<ChevronRight className="rtl:-scale-x-100" /></Link></Button>
}

function Meta({ children }: { children: ReactNode }) {
  return <span className="text-[13px] text-muted-foreground tabular-nums">{children}</span>
}

function Row({ label, sub, value, negative, swatch, badge }: { label: ReactNode; sub?: ReactNode; value: ReactNode; negative?: boolean; swatch?: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-2 truncate text-sm font-medium">{swatch && <span className="size-2.5 shrink-0 rounded-full" style={{ background: swatch }} />}{label}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </span>
      {badge}
      <span className={cn("font-medium tabular-nums", negative && "text-destructive")}>{value}</span>
    </div>
  )
}

function NetWorthTile({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useHomeMoney()
  const worth = useNetWorthWidget(widget)
  const compact = widget.size === "compact"
  return (
    <Tile widget={widget} tone="hero" tour="home-networth" title={widget.title || t("home.netWorth")}
      aside={<Go to={worth.simple ? "/accounts" : "/networth"}>{worth.simple ? t("nav.accounts") : t("home.openNetWorth")}</Go>}>
      <span className={cn("font-bold tracking-tight tabular-nums", compact ? "text-2xl" : "text-[34px] leading-10", worth.netWorth < 0 && "text-destructive")}>{money(worth.netWorth)}</span>
      {!compact && !worth.byClass && <Meta>{t("networth.assets")}: {money(worth.totalAssets)} · {t("networth.liabilities")}: {money(worth.totalLiabilities)}</Meta>}
      {!compact && worth.byClass && <div>{worth.classes.map((c) => <Row key={c.assetClass} label={t(`networth.classes.${c.assetClass}`)} value={money(c.amount)} />)}</div>}
      {!compact && worth.hiddenCounted && <Meta>{t("appMode.includesAdvanced")}</Meta>}
    </Tile>
  )
}

function MonthTile({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useHomeMoney()
  const flow = useMonthWidget()
  const compact = widget.size === "compact"
  return (
    <Tile widget={widget} title={widget.title || t("home.monthTitle")} aside={<Go to="/report">{t("nav.report")}</Go>}>
      <span className={cn("text-[26px] leading-8 font-semibold tabular-nums", flow.left < 0 && "text-destructive")}>{money(flow.left)} <span className="text-base font-medium text-muted-foreground">{t("home.monthLeft")}</span></span>
      {!compact && (
        <>
          <span className="flex h-2 overflow-hidden rounded-full bg-muted"><span className="rounded-full bg-primary" style={{ width: `${flow.spentPercent}%` }} /></span>
          <div className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between gap-3"><span className="text-muted-foreground">{t("home.monthReceived")}</span><span className="font-semibold text-success tabular-nums">{flow.received > 0 ? "+" : ""}{money(flow.received)}</span></span>
            <span className="flex justify-between gap-3"><span className="text-muted-foreground">{t("home.monthSpent")}</span><span className="font-semibold tabular-nums">{flow.spent > 0 ? "−" : ""}{money(flow.spent)}</span></span>
          </div>
        </>
      )}
    </Tile>
  )
}

function PlanTile({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useHomeMoney()
  const plan = usePlanWidget(widget)
  const unit = t(`homeLayout.options.figure.values.${plan.figure}`)
  if (widget.size === "compact") {
    return (
      <Tile widget={widget} tour="home-plan" title={widget.title || t("home.planTitle")} aside={<Go to="/plan">{t("home.viewPlan")}</Go>}>
        <span className="text-2xl font-semibold tabular-nums">{money(plan.total)} <span className="text-base font-medium text-muted-foreground">{unit}</span></span>
      </Tile>
    )
  }
  return (
    <Tile widget={widget} tour="home-plan" title={widget.title || t("home.planTitle")}
      aside={<Meta>{t("home.incomePlanned")}: {money(plan.planned)} · {t("home.incomeReceived")}: {money(plan.received)}</Meta>}>
      {plan.rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-1 sm:grid-cols-[140px_minmax(0,1fr)_auto]">
          <span className="flex min-w-0 items-center gap-2 truncate font-medium"><span className="size-2.5 shrink-0 rounded-full" style={{ background: row.colour }} />{row.name}</span>
          <span className="order-last col-span-2 flex h-2 overflow-hidden rounded-full bg-muted sm:order-none sm:col-span-1"><span className="rounded-full" style={{ width: `${row.usedPercent}%`, background: row.colour }} /></span>
          <span className={cn("text-end font-semibold tabular-nums", row.value < 0 && "text-destructive", row.value === 0 && "text-muted-foreground")}>{money(row.value)} <span className="text-[13px] font-normal text-muted-foreground">{unit}</span></span>
        </div>
      ))}
      <Button asChild variant="secondary" className="self-start bg-accent text-accent-foreground hover:bg-accent/80"><Link to="/plan">{t("home.viewPlan")}</Link></Button>
    </Tile>
  )
}

function MetalsTile({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useHomeMoney()
  const metals = useMetalsWidget(widget)
  return (
    <Tile widget={widget} tone="gold" tour="home-metals" title={<><Gem className="size-4" />{widget.title || t("home.metalsTitle")}</>} aside={<Go to="/metals">{t("nav.metals")}</Go>}>
      <span className={cn("text-[26px] leading-8 font-semibold tabular-nums", metals.shown < 0 ? "text-destructive" : metals.showGain && metals.shown > 0 && "text-success")}>{(metals.showGain && metals.shown > 0 ? "+" : "") + money(metals.shown)}</span>
      {widget.size !== "compact" && <Meta>{metals.empty ? t("home.metalsNone") : metals.showGain ? `${t("metals.valueNow")}: ${money(metals.value)}` : `${t("metals.gain")}: ${money(metals.gain)}`}</Meta>}
    </Tile>
  )
}

function BillsTile({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useHomeMoney()
  const formatDay = useDateFormat()
  const bills = useBillsWidget(widget)
  return (
    <Tile widget={widget} tour="home-bills" title={widget.title || t("home.upcomingBills")} aside={<Go to="/bills">{t("nav.bills")}</Go>}>
      {widget.size === "compact" && <span className="text-2xl font-semibold tabular-nums">{money(bills.due)}</span>}
      {widget.size !== "compact" && (
        <div>
          {bills.listed.map((bill) => (
            <Row key={`${bill.expense.id}-${bill.dueDate}`} label={bill.expense.name} sub={t("bills.dueOn", { date: formatDay(bill.dueDate, { day: "numeric", month: "short" }) })}
              badge={bill.dueDate < bills.today ? <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">{t("bills.overdue")}</span> : undefined}
              value={(bill.expense.isEstimate ? "≈ " : "") + money(bill.expectedAmount)} />
          ))}
          {bills.none && <p className="text-sm text-muted-foreground">{t("home.noUpcoming")}</p>}
        </div>
      )}
    </Tile>
  )
}

function CashTile({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useHomeMoney()
  const cash = useCashWidget(widget)
  return (
    <Tile widget={widget} title={widget.title || t("home.cashTotal")} aside={<Go to="/accounts">{cash.count === 0 ? t("home.addAccount") : t("home.accounts", { count: cash.count })}</Go>}>
      {cash.count === 0 && <p className="text-sm text-muted-foreground">{t("home.noAccounts")}</p>}
      {cash.totals.map(([currency, total]) => <span key={currency} className="text-[26px] leading-8 font-semibold tabular-nums">{money(total, currency)}</span>)}
      {widget.size !== "compact" && cash.shares.length > 1 && (
        <>
          <span className="flex h-2 gap-0.5">{cash.shares.map((s, i) => <span key={s.id} className={cn("rounded-full", SHARE_COLOURS[i % SHARE_COLOURS.length])} style={{ width: `${s.percent}%` }} />)}</span>
          <span className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">{cash.shares.map((s, i) => <span key={s.id} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm", SHARE_COLOURS[i % SHARE_COLOURS.length])} />{s.name}</span>)}</span>
        </>
      )}
    </Tile>
  )
}

function GoalsTile({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const goals = useGoalsWidget(widget)
  return (
    <Tile widget={widget} title={widget.title || t("nav.goals")} aside={<Go to="/goals">{t("nav.goals")}</Go>}>
      {goals.length === 0 && <p className="text-sm text-muted-foreground">{t("homeLayout.noGoals")}</p>}
      {widget.size === "compact" && goals[0] && <span className="truncate text-xl font-semibold tabular-nums">{goals[0].name} · {goals[0].percent}%</span>}
      {widget.size !== "compact" && goals.map((goal) => (
        <div key={goal.id} className="flex flex-col gap-1.5">
          <span className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{goal.name}</span><span className="font-semibold tabular-nums">{goal.percent}%</span></span>
          <span className="flex h-2 overflow-hidden rounded-full bg-muted"><span className="rounded-full bg-primary" style={{ width: `${Math.min(100, goal.percent)}%` }} /></span>
        </div>
      ))}
    </Tile>
  )
}

function DebtsTile({ widget }: WidgetProps) {
  const { t } = useTranslation()
  const { money } = useHomeMoney()
  const debts = useDebtsWidget(widget)
  return (
    <Tile widget={widget} title={widget.title || t(`homeLayout.options.direction.values.${debts.direction}`)} aside={<Go to="/debts">{t("nav.debts")}</Go>}>
      {debts.rows.length === 0 && <p className="text-sm text-muted-foreground">{t("homeLayout.noDebts")}</p>}
      {widget.size === "compact" && debts.rows.length > 0 && <span className="text-xl font-semibold tabular-nums">{debts.rows.map((d) => money(d.balance, d.currency)).join(" · ")}</span>}
      {widget.size !== "compact" && <div>{debts.rows.map((debt) => <Row key={debt.id} label={debt.name} value={money(debt.balance, debt.currency)} />)}</div>}
    </Tile>
  )
}

const TILES: Record<HomeWidget["kind"], (props: WidgetProps) => ReactNode> = {
  netWorth: NetWorthTile,
  month: MonthTile,
  // The rates card belongs to Prices and keeps its own drawing; here it only takes its place in the grid.
  dollar: ({ widget }) => <div className={cn("min-w-0 [&>*]:h-full", widget.size === "compact" ? "lg:col-span-4" : SPAN.dollar)}><RatesTodayCard title={widget.title} /></div>,
  plan: PlanTile,
  metals: MetalsTile,
  bills: BillsTile,
  cash: CashTile,
  goals: GoalsTile,
  debts: DebtsTile,
}

function Banner({ icon, tone, children, action }: { icon: ReactNode; tone?: "warn"; children: ReactNode; action: ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm [&>svg]:size-5 [&>svg]:shrink-0",
      tone === "warn" ? "border-warning/30 bg-warning-soft [&>svg]:text-warning" : "border-link/20 bg-info-soft [&>svg]:text-link")}>
      {icon}<span className="min-w-0 flex-1">{children}</span>{action}
    </div>
  )
}

/** Soft: a greeting, notices as slim banners, then the Home cards on a twelve-column grid. */
export default function HomeSoft({ model }: { model: HomePageModel }) {
  const { t } = useTranslation()
  const formatDay = useDateFormat()

  if (model.audience === "dependent") {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-[28px] leading-9">{t("home.greeting", { name: model.name })}</h1>
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="text-muted-foreground">{t("home.dependentBody", { household: model.householdName })}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link to="/goals">{t("nav.goals")}</Link></Button>
            <Button asChild variant="outline"><Link to="/transactions">{t("nav.transactions")}</Link></Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 text-[28px] leading-9">{t("home.greeting", { name: model.name })}</h1>
        <span className="hidden text-[13px] text-muted-foreground sm:inline">{formatDay(model.today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        <HelpButton tour="welcome" />
      </div>

      {(model.needsVerify || model.recoveryReminder || model.canInstall || model.stale) && (
        <div className="flex flex-col gap-2">
          {model.needsVerify && <Banner icon={<Info />} action={<Button asChild size="sm" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80"><Link to="/verify">{t("auth.verify")}</Link></Button>}>{t("auth.verifyTitle")}</Banner>}
          {model.recoveryReminder && (
            <Banner icon={<KeyRound />} action={
              <span className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80" onClick={model.keepRecoveryCode}>{t("vault.reminderKept")}</Button>
                <Button asChild size="sm" variant="ghost" className="text-link"><Link to="/settings#s-recovery">{t("vault.reminderNew")}</Link></Button>
              </span>
            }>
              <span className="font-semibold">{t("vault.reminderTitle")}</span> {t("vault.reminderBody")}
            </Banner>
          )}
          {model.canInstall && <Banner icon={<Download />} action={<InstallButton size="sm" />}>{t("install.homePrompt")}</Banner>}
          {model.stale && <Banner tone="warn" icon={<TriangleAlert />} action={<Button asChild size="sm" variant="ghost" className="text-link"><Link to="/assets">{t("nav.assets")}</Link></Button>}>{t("assets.stalePrompt", model.stale)}</Banner>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {model.widgets.map((widget) => {
          const Tile = TILES[widget.kind]
          return <Tile key={widget.id} widget={widget} />
        })}
      </div>

      <Button asChild variant="ghost" className="self-start text-link"><Link to="/settings#home">{t("homeLayout.customise")}</Link></Button>
    </div>
  )
}
