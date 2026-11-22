import type { Href } from "expo-router"
import { useTranslation } from "react-i18next"

import { logout } from "@mizan/core/auth/session"
import { shows, type AdvancedArea } from "@mizan/core/domain/appMode"
import { useAppMode } from "@/hooks/use-app-mode"
import { useSession } from "@/hooks/use-core"
import { audienceOf, type Audience } from "@/utils/roles"

type GroupId = "money" | "owned" | "insight" | "app"

interface Destination {
  id: string
  href: Href
  label: string
  audiences: Audience[]
  group: GroupId
  area?: AdvancedArea
}

const EVERYONE: Audience[] = ["FULL", "DEPENDENT", "ADVISOR"]
const MEMBERS: Audience[] = ["FULL"]
const GROUPS: GroupId[] = ["money", "owned", "insight", "app"]

/** Everything that does not earn a tab, trimmed to what the signed-in role may open (ADR styles-1 for the split from its views). */
export function useMoreScreen() {
  const { t } = useTranslation()
  const audience = audienceOf(useSession())
  const mode = useAppMode()
  const destinations: Destination[] = [
    { id: "accounts", href: "/accounts", label: t("nav.accounts"), audiences: MEMBERS, group: "money" },
    { id: "income", href: "/income", label: t("nav.income"), audiences: MEMBERS, group: "money", area: "income" },
    { id: "bills", href: "/bills", label: t("nav.bills"), audiences: MEMBERS, group: "money", area: "bills" },
    { id: "debts", href: "/debts", label: t("nav.debts"), audiences: MEMBERS, group: "money" },
    { id: "networth", href: "/networth", label: t("nav.networth"), audiences: MEMBERS, group: "owned", area: "networth" },
    { id: "metals", href: "/metals", label: t("nav.metals"), audiences: MEMBERS, group: "owned", area: "metals" },
    { id: "assets", href: "/assets", label: t("nav.assets"), audiences: MEMBERS, group: "owned", area: "assets" },
    { id: "goals", href: "/goals", label: t("nav.goals"), audiences: ["FULL", "DEPENDENT"], group: "owned", area: "goals" },
    { id: "report", href: "/report", label: t("nav.report"), audiences: MEMBERS, group: "insight" },
    { id: "prices", href: "/prices", label: t("nav.prices"), audiences: EVERYONE, group: "insight" },
    { id: "household", href: "/household", label: t("household.title"), audiences: EVERYONE, group: "app", area: "household" },
    { id: "settings", href: "/settings", label: t("nav.settings"), audiences: EVERYONE, group: "app" },
    { id: "sync", href: "/sync", label: t("nav.sync"), audiences: EVERYONE, group: "app" },
    { id: "help", href: "/help", label: t("help.title"), audiences: EVERYONE, group: "app" },
    { id: "support", href: "/support", label: t("support.title"), audiences: EVERYONE, group: "app" },
    ...(__DEV__ ? [{ id: "diagnostics", href: "/diagnostics", label: "Diagnostics", audiences: EVERYONE, group: "app" } satisfies Destination] : []),
  ]
  const shown = destinations.filter((d) => d.audiences.includes(audience) && shows(mode, d.area))
  return {
    shown,
    groups: GROUPS.map((id) => ({ id, title: t(`more.groups.${id}`), items: shown.filter((d) => d.group === id) })).filter((group) => group.items.length > 0),
    signOut: () => void logout(),
  }
}

export type MoreScreenModel = ReturnType<typeof useMoreScreen>
