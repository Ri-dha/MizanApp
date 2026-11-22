import { Banknote, BarChart3, BookOpen, Car, ChartLine, Gem, HandCoins, LifeBuoy, PiggyBank, Receipt, RefreshCw, Scale, Settings, Users, Wallet, type LucideIcon } from "lucide-react"

import type { AdvancedArea } from "@mizan/core/domain/appMode"

export type MoreGroup = "money" | "own" | "app"

export interface MoreLink {
  to: string
  key: string
  icon: LucideIcon
  area?: AdvancedArea
  group: MoreGroup
  /** Tailwind classes for the icon tile; app links share one quiet tone. */
  tone: string
}

const QUIET = "bg-accent text-accent-foreground"

export const MORE_GROUPS: readonly MoreGroup[] = ["money", "own", "app"]

export const MORE_LINKS: readonly MoreLink[] = [
  { to: "/networth", key: "nav.networth", icon: Scale, area: "networth", group: "own", tone: "bg-primary text-primary-foreground" },
  { to: "/report", key: "nav.report", icon: BarChart3, group: "own", tone: "bg-bucket-2 text-background" },
  { to: "/income", key: "nav.income", icon: Wallet, area: "income", group: "money", tone: "bg-bucket-1 text-background" },
  { to: "/bills", key: "nav.bills", icon: Receipt, area: "bills", group: "money", tone: "bg-bucket-4 text-background" },
  { to: "/metals", key: "nav.metals", icon: Gem, area: "metals", group: "own", tone: "bg-gold text-on-gold" },
  { to: "/prices", key: "nav.prices", icon: ChartLine, group: "own", tone: "bg-bucket-7 text-background" },
  { to: "/accounts", key: "nav.accounts", icon: Banknote, group: "money", tone: "bg-bucket-7 text-background" },
  { to: "/assets", key: "nav.assets", icon: Car, area: "assets", group: "own", tone: "bg-bucket-6 text-background" },
  { to: "/debts", key: "nav.debts", icon: HandCoins, group: "money", tone: "bg-bucket-5 text-background" },
  { to: "/goals", key: "nav.goals", icon: PiggyBank, area: "goals", group: "own", tone: "bg-bucket-3 text-background" },
  { to: "/household", key: "household.title", icon: Users, area: "household", group: "app", tone: QUIET },
  { to: "/help", key: "help.title", icon: BookOpen, group: "app", tone: QUIET },
  { to: "/support", key: "support.title", icon: LifeBuoy, group: "app", tone: QUIET },
  { to: "/sync", key: "nav.sync", icon: RefreshCw, group: "app", tone: QUIET },
  { to: "/settings", key: "nav.settings", icon: Settings, group: "app", tone: QUIET },
]
