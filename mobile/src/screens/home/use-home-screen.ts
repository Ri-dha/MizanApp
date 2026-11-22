import { useTranslation } from "react-i18next"

import { staleAssets } from "@mizan/core/db/assets"
import { shownWidgets, widgetsFor } from "@mizan/core/db/homeLayout"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { useAppMode } from "@/hooks/use-app-mode"
import { useSession } from "@/hooks/use-core"
import { useHomeLayout } from "@/hooks/use-home-layout"
import { useNetWorth } from "@/hooks/use-views"
import { usePreferences } from "@/preferences"
import { useScreenTour } from "@/tours"

/** Everything Home knows apart from its cards; the templates only decide how it is drawn (ADR styles-1). */
export function useHomeScreen() {
  const { t } = useTranslation()
  useScreenTour("welcome")
  const session = useSession()
  const layout = useHomeLayout()
  const prefs = usePreferences()
  const worth = useNetWorth()
  const mode = useAppMode()
  const stale = staleAssets(worth.assets, worth.valuations, todayIso(), prefs.valuationReminderMonths)
  return {
    title: t("home.greeting", { name: session?.displayName ?? "" }),
    verifyNotice: session && !session.verified ? `${t("auth.verifyTitle")} · ${t("auth.verify")}` : null,
    staleNotice: stale.length > 0 && mode !== "simple"
      ? t("assets.stalePrompt", { count: stale.length, name: stale[0].name, months: prefs.valuationReminderMonths })
      : null,
    widgets: widgetsFor(mode, shownWidgets(layout)),
  }
}

export type HomeScreenModel = ReturnType<typeof useHomeScreen>
