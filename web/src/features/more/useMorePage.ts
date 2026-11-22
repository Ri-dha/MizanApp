import { ShieldCheck } from "lucide-react"

import { shows } from "@mizan/core/domain/appMode"
import { useSession } from "@/api/auth"
import { useAppMode } from "@/app/appMode"
import { MORE_GROUPS, MORE_LINKS, type MoreGroup, type MoreLink } from "./links"

export function useMorePage() {
  const session = useSession()
  const mode = useAppMode()
  const links: MoreLink[] = [
    ...MORE_LINKS.filter((l) => shows(mode, l.area)),
    ...(session?.operator ? [{ to: "/admin", key: "admin.nav", icon: ShieldCheck, group: "app" as MoreGroup, tone: "bg-accent text-accent-foreground" }] : []),
  ]
  return {
    groups: MORE_GROUPS.map((id) => ({ id, links: links.filter((l) => l.group === id) })).filter((g) => g.links.length > 0),
  }
}

export type MorePageModel = ReturnType<typeof useMorePage>
