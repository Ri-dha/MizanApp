import { useSession } from "@/api/auth"
import { useAppMode } from "@/app/appMode"
import { usePreferences } from "@/app/preferences"
import { useNetWorth } from "@/features/networth/useNetWorth"
import { useInstallState } from "@/pwa/register"
import { useScreenTour } from "@/tours/useTour"
import { staleAssets } from "@mizan/core/db/assets"
import { shownWidgets, widgetsFor, type HomeWidget } from "@mizan/core/db/homeLayout"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { useHomeLayout } from "./useHomeLayout"

export interface HomePageModel {
  /** Advisers are sent to their own area; dependents get a short page with no household figures. */
  audience: "advisor" | "dependent" | "member"
  name: string | undefined
  householdName: string | undefined
  today: string
  needsVerify: boolean
  canInstall: boolean
  stale: { count: number; name: string; months: number } | null
  widgets: HomeWidget[]
}

export function useHomePage(): HomePageModel {
  const session = useSession()
  const worth = useNetWorth()
  const prefs = usePreferences()
  const installState = useInstallState()
  const layout = useHomeLayout()
  const mode = useAppMode()
  useScreenTour("welcome", session !== undefined)
  const today = todayIso()
  const stale = staleAssets(worth.assets, worth.valuations, today, prefs.valuationReminderMonths)

  return {
    audience: session?.role === "ADVISOR" ? "advisor" : session?.role === "DEPENDENT" ? "dependent" : "member",
    name: session?.displayName,
    householdName: session?.householdName,
    today,
    needsVerify: session !== undefined && !session.verified,
    canInstall: installState !== "installed",
    stale: stale.length > 0 && mode !== "simple" ? { count: stale.length, name: stale[0].name, months: prefs.valuationReminderMonths } : null,
    widgets: widgetsFor(mode, shownWidgets(layout)),
  }
}
