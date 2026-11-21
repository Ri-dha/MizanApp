import { useTranslation } from "react-i18next"
import { Link, Navigate } from "react-router"

import { useSession } from "@/api/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { staleAssets } from "@mizan/core/db/assets"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { usePreferences } from "@/app/preferences"
import { useAppMode } from "@/app/appMode"
import { useNetWorth } from "@/features/networth/useNetWorth"
import { HelpButton } from "@/components/HelpButton"
import { InstallButton } from "@/components/InstallButton"
import { useInstallState } from "@/pwa/register"
import { useScreenTour } from "@/tours/useTour"
import { HomeWidgets } from "./HomeWidgets"
import { useHomeLayout } from "./useHomeLayout"

export function HomePage() {
  const { t } = useTranslation()
  const session = useSession()
  const worth = useNetWorth()
  const prefs = usePreferences()
  const installState = useInstallState()
  const stale = staleAssets(worth.assets, worth.valuations, todayIso(), prefs.valuationReminderMonths)
  useScreenTour("welcome", session !== undefined)
  const layout = useHomeLayout()
  const simple = useAppMode() === "simple"

  if (session?.role === "ADVISOR") return <Navigate to="/advisor" replace />
  if (session?.role === "DEPENDENT") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl">{t("home.greeting", { name: session.displayName })}</h1>
        <p className="opacity-70">{t("home.dependentBody", { household: session.householdName })}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link to="/goals">{t("nav.goals")}</Link></Button>
          <Button asChild variant="outline"><Link to="/transactions">{t("nav.transactions")}</Link></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl">{t("home.greeting", { name: session?.displayName })}</h1>
        <HelpButton tour="welcome" />
      </div>

      {session && !session.verified && (
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{t("auth.verifyTitle")}</span>
            <Button asChild size="sm"><Link to="/verify">{t("auth.verify")}</Link></Button>
          </AlertDescription>
        </Alert>
      )}

      {installState !== "installed" && (
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{t("install.homePrompt")}</span>
            <InstallButton size="sm" />
          </AlertDescription>
        </Alert>
      )}

      {stale.length > 0 && !simple && (
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>{t("assets.stalePrompt", { count: stale.length, name: stale[0].name, months: prefs.valuationReminderMonths })}</span>
            <Button asChild size="sm"><Link to="/assets">{t("nav.assets")}</Link></Button>
          </AlertDescription>
        </Alert>
      )}

      <HomeWidgets layout={layout} />

      <Button asChild variant="ghost" className="self-start"><Link to="/settings#home">{t("homeLayout.customise")}</Link></Button>
    </div>
  )
}
