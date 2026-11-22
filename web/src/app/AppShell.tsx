import { Suspense } from "react"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router"

import { DisplayRatesSync } from "@/app/displayRates"
import { styleViews } from "@/app/style"
import { SyncedPreferencesSync } from "@/app/syncedPreferences"
import { AnnouncementBanner } from "@/components/AnnouncementBanner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QuickAddSheet } from "@/features/transactions/QuickAddSheet"
import { RecoveryCodeDialog } from "@/features/vault/VaultScreens"
import { TourProvider } from "@/tours/TourProvider"
import { useAppShell, type AppShellModel } from "./useAppShell"
import ShellSoft from "./views/ShellSoft"

// The shell frames every page, so its fallback view is bundled rather than fetched after first paint.
const ShellView = styleViews<{ model: AppShellModel; children: React.ReactNode }>({ soft: ShellSoft })

export function AppShell() {
  const { t } = useTranslation()
  const model = useAppShell()
  return (
    <>
      <DisplayRatesSync />
      <SyncedPreferencesSync />
      <ShellView model={model}>
        {/* ADR e2e-1: only a member's device can share the key, so a new member sees an empty household until then. */}
        {model.sync.awaitingKey && <Alert className="mb-4"><AlertDescription>{t("sync.awaitingKey")}</AlertDescription></Alert>}
        <AnnouncementBanner />
        <Suspense fallback={<p className="opacity-70">{t("common.loading")}</p>}>
          <Outlet />
        </Suspense>
      </ShellView>
      <QuickAddSheet open={model.adding} transaction={null} onClose={() => model.setAdding(false)} />
      <TourProvider />
      <RecoveryCodeDialog />
    </>
  )
}
