import { Banknote, BarChart3, ChartLine, HandCoins, House, ListOrdered, PieChart, PiggyBank, Receipt, Settings, type LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { shows } from "@mizan/core/domain/appMode"
import { mayReadQuotes } from "@mizan/core/roles"
import { useSession } from "@/api/auth"
import { takePendingInvite } from "@/api/household"
import { useAppMode } from "@/app/appMode"
import { useShownCurrency } from "@/app/displayRates"
import { setPreferences } from "@/app/preferences"
import { MORE_LINKS } from "@/features/more/links"
import { fetchLiveQuotes } from "@/market/store"
import { useSyncStatus } from "@/sync/engine"

export interface ShellLink {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function useAppShell() {
  const { t } = useTranslation()
  const session = useSession()
  const [adding, setAdding] = useState(false)
  const navigate = useNavigate()
  const mode = useAppMode()
  const status = useSyncStatus()
  const shownCurrency = useShownCurrency()
  const role = session?.role

  useEffect(() => {
    const pending = takePendingInvite()
    if (pending) navigate(`/join/${pending}`)
  }, [navigate])

  // Prices are fetched on request only: once when the app loads, and when the user presses Refresh.
  useEffect(() => {
    if (navigator.onLine && session && mayReadQuotes(session.role)) void fetchLiveQuotes().catch(() => undefined)
  }, [session?.role])

  // §4.2: a dependent gets their own ledger and goals; an advisor gets the report and nothing else.
  const primary: ShellLink[] = role === "DEPENDENT"
    ? [
      { to: "/", label: t("nav.home"), icon: House, end: true },
      { to: "/transactions", label: t("nav.transactions"), icon: ListOrdered },
      { to: "/goals", label: t("nav.goals"), icon: PiggyBank },
      { to: "/prices", label: t("nav.prices"), icon: ChartLine },
      { to: "/settings", label: t("nav.settings"), icon: Settings },
    ]
    : role === "ADVISOR"
      ? [
        { to: "/advisor", label: t("advisor.nav"), icon: BarChart3, end: true },
        { to: "/household", label: t("household.title"), icon: House },
        { to: "/help", label: t("help.title"), icon: ListOrdered },
        { to: "/prices", label: t("nav.prices"), icon: ChartLine },
        { to: "/settings", label: t("nav.settings"), icon: Settings },
      ]
      : mode === "simple"
        ? [
          { to: "/", label: t("nav.home"), icon: House, end: true },
          { to: "/transactions", label: t("nav.transactions"), icon: ListOrdered },
          { to: "/accounts", label: t("nav.accounts"), icon: Banknote },
          { to: "/debts", label: t("nav.debts"), icon: HandCoins },
        ]
        : [
          { to: "/", label: t("nav.home"), icon: House, end: true },
          { to: "/transactions", label: t("nav.transactions"), icon: ListOrdered },
          { to: "/plan", label: t("nav.plan"), icon: PieChart },
          { to: "/bills", label: t("nav.bills"), icon: Receipt },
        ]
  const restricted = role === "DEPENDENT" || role === "ADVISOR"
  const sidebar: ShellLink[] = restricted
    ? primary
    : [...primary, ...MORE_LINKS.filter((l) => shows(mode, l.area) && !primary.some((p) => p.to === l.to)).map((l) => ({ to: l.to, label: t(l.key), icon: l.icon, end: false }))]

  return {
    canWrite: role !== "VIEWER" && role !== "ADVISOR",
    primary,
    sidebar,
    restricted,
    operator: Boolean(session?.operator),
    householdName: session?.householdName,
    adding,
    setAdding,
    shownCurrency,
    stopShowingCurrency: () => setPreferences({ displayCurrency: null }),
    sync: {
      label: status.pending > 0 ? t("sync.status.pending", { count: status.pending }) : t(`sync.status.${status.phase}`),
      state: status.phase === "error" ? "error" as const : status.pending > 0 || status.phase !== "idle" ? "busy" as const : "ok" as const,
      awaitingKey: status.awaitingKey,
    },
  }
}

export type AppShellModel = ReturnType<typeof useAppShell>
