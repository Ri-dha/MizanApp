import { LifeBuoy, Banknote, BarChart3, BookOpen, Car, ChartLine, Gem, Users, HandCoins, PiggyBank, Receipt, RefreshCw, Scale, Settings, ShieldCheck, Wallet } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { useSession } from "@/api/auth"
import { useAppMode } from "@/app/appMode"
import { shows, type AdvancedArea } from "@mizan/core/domain/appMode"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const MORE_LINKS: readonly { to: string; key: string; icon: LucideIcon; area?: AdvancedArea }[] = [
  { to: "/networth", key: "nav.networth", icon: Scale, area: "networth" },
  { to: "/report", key: "nav.report", icon: BarChart3 },
  { to: "/income", key: "nav.income", icon: Wallet, area: "income" },
  { to: "/bills", key: "nav.bills", icon: Receipt, area: "bills" },
  { to: "/metals", key: "nav.metals", icon: Gem, area: "metals" },
  { to: "/prices", key: "nav.prices", icon: ChartLine },
  { to: "/accounts", key: "nav.accounts", icon: Banknote },
  { to: "/assets", key: "nav.assets", icon: Car, area: "assets" },
  { to: "/debts", key: "nav.debts", icon: HandCoins },
  { to: "/goals", key: "nav.goals", icon: PiggyBank, area: "goals" },
  { to: "/household", key: "household.title", icon: Users, area: "household" },
  { to: "/help", key: "help.title", icon: BookOpen },
  { to: "/support", key: "support.title", icon: LifeBuoy },
  { to: "/sync", key: "nav.sync", icon: RefreshCw },
  { to: "/settings", key: "nav.settings", icon: Settings },
]

export function MorePage() {
  const { t } = useTranslation()
  const session = useSession()
  const mode = useAppMode()
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl">{t("nav.more")}</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...MORE_LINKS.filter((l) => shows(mode, l.area)), ...(session?.operator ? [{ to: "/admin", key: "admin.nav", icon: ShieldCheck }] : [])].map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="h-full"><CardContent className="flex items-center gap-3 py-4 font-semibold"><link.icon className="size-5" />{t(link.key)}</CardContent></Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
