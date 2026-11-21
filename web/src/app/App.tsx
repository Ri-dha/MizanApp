import { lazy, Suspense } from "react"
import { DirectionProvider } from "@radix-ui/react-direction"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { createBrowserRouter, RouterProvider } from "react-router"

import { loadSession } from "@/api/auth"
import { Toaster } from "@/components/ui/sonner"
import { directionFor } from "@/i18n"
import { initialiseLock, startLockWatcher } from "@/lock/store"
import { initialiseVault } from "@/vault/account"
import { AppShell } from "./AppShell"
import { AreaGate } from "./AreaGate"
import { RequireSession, RedirectIfSession } from "./guards"
import { LoginPage } from "@/features/auth/LoginPage"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage"
const SupportPage = lazy(() => import("@/features/support/SupportPage").then((m) => ({ default: m.SupportPage })))
const NewReportPage = lazy(() => import("@/features/support/NewReportPage").then((m) => ({ default: m.NewReportPage })))
const SupportThreadPage = lazy(() => import("@/features/support/SupportThreadPage").then((m) => ({ default: m.SupportThreadPage })))
const VerifyPage = lazy(() => import("@/features/auth/VerifyPage").then((m) => ({ default: m.VerifyPage })))
import { HomePage } from "@/features/home/HomePage"
const AccountsPage = lazy(() => import("@/features/accounts/AccountsPage").then((m) => ({ default: m.AccountsPage })))
const IncomePage = lazy(() => import("@/features/income/IncomePage").then((m) => ({ default: m.IncomePage })))
const PlanPage = lazy(() => import("@/features/plan/PlanPage").then((m) => ({ default: m.PlanPage })))
const TransactionsPage = lazy(() => import("@/features/transactions/TransactionsPage").then((m) => ({ default: m.TransactionsPage })))
const BillsPage = lazy(() => import("@/features/bills/BillsPage").then((m) => ({ default: m.BillsPage })))
const DebtsPage = lazy(() => import("@/features/debts/DebtsPage").then((m) => ({ default: m.DebtsPage })))
const GoalsPage = lazy(() => import("@/features/goals/GoalsPage").then((m) => ({ default: m.GoalsPage })))
const MorePage = lazy(() => import("@/features/more/MorePage").then((m) => ({ default: m.MorePage })))
const MetalsPage = lazy(() => import("@/features/metals/MetalsPage").then((m) => ({ default: m.MetalsPage })))
const NetWorthPage = lazy(() => import("@/features/networth/NetWorthPage").then((m) => ({ default: m.NetWorthPage })))
const AssetsPage = lazy(() => import("@/features/assets/AssetsPage").then((m) => ({ default: m.AssetsPage })))
const HouseholdPage = lazy(() => import("@/features/household/HouseholdPage").then((m) => ({ default: m.HouseholdPage })))
const JoinPage = lazy(() => import("@/features/household/JoinPage").then((m) => ({ default: m.JoinPage })))
const HelpPage = lazy(() => import("@/features/help/HelpPage").then((m) => ({ default: m.HelpPage })))
const ReportPage = lazy(() => import("@/features/report/ReportPage").then((m) => ({ default: m.ReportPage })))
const YearReportPage = lazy(() => import("@/features/report/YearReportPage").then((m) => ({ default: m.YearReportPage })))
const PricesPage = lazy(() => import("@/features/prices/PricesPage").then((m) => ({ default: m.PricesPage })))
const AdminPage = lazy(() => import("@/features/admin/AdminPage").then((m) => ({ default: m.AdminPage })))
const AdvisorPage = lazy(() => import("@/features/advisor/AdvisorPage").then((m) => ({ default: m.AdvisorPage })))
const SyncPage = lazy(() => import("@/features/sync/SyncPage").then((m) => ({ default: m.SyncPage })))
const RouteError = lazy(() => import("@/app/RouteError").then((m) => ({ default: m.RouteError })))
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })))

const routeError = <Suspense fallback={null}><RouteError /></Suspense>

const router = createBrowserRouter([
  {
    element: <RedirectIfSession />,
    errorElement: routeError,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/reset", element: <ResetPasswordPage /> },
    ],
  },
  { path: "/join/:token", element: <Suspense fallback={null}><JoinPage /></Suspense>, errorElement: routeError },
  {
    path: "/",
    errorElement: routeError,
    element: (
      <RequireSession>
        <AppShell />
      </RequireSession>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "verify", element: <VerifyPage /> },
      { path: "transactions", element: <TransactionsPage /> },
      { path: "plan", element: <AreaGate area="plan"><PlanPage /></AreaGate> },
      { path: "bills", element: <AreaGate area="bills"><BillsPage /></AreaGate> },
      { path: "debts", element: <DebtsPage /> },
      { path: "goals", element: <AreaGate area="goals"><GoalsPage /></AreaGate> },
      { path: "metals", element: <AreaGate area="metals"><MetalsPage /></AreaGate> },
      { path: "networth", element: <AreaGate area="networth"><NetWorthPage /></AreaGate> },
      { path: "report", element: <ReportPage /> },
      { path: "report/year", element: <AreaGate area="yearReport"><YearReportPage /></AreaGate> },
      { path: "help", element: <HelpPage /> },
      { path: "help/:slug", element: <HelpPage /> },
      { path: "support", element: <SupportPage /> },
      { path: "support/new", element: <NewReportPage /> },
      { path: "support/:id", element: <SupportThreadPage /> },
      { path: "more", element: <MorePage /> },
      { path: "income", element: <AreaGate area="income"><IncomePage /></AreaGate> },
      { path: "accounts", element: <AccountsPage /> },
      { path: "assets", element: <AreaGate area="assets"><AssetsPage /></AreaGate> },
      { path: "sync", element: <SyncPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "household", element: <AreaGate area="household"><HouseholdPage /></AreaGate> },
      { path: "advisor", element: <AdvisorPage /> },
      { path: "prices", element: <PricesPage /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
])

export default function App() {
  const { i18n } = useTranslation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void Promise.all([loadSession(), initialiseLock(), initialiseVault()]).then(() => setReady(true))
    startLockWatcher()
  }, [])

  if (!ready) return null

  return (
    <DirectionProvider dir={directionFor(i18n.language)}>
      <RouterProvider router={router} />
      <Toaster position="bottom-center" />
    </DirectionProvider>
  )
}
