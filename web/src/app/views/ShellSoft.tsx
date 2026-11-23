import { CircleAlert, CircleCheck, LogOut, MoreHorizontal, Plus, RefreshCw, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link, NavLink } from "react-router"

import { cn } from "@/lib/utils"
import type { AppShellModel } from "../useAppShell"

/** Soft: a card-coloured sidebar with the wordmark and sync state on top, and a five-tab bar with a square add button at phone width. */
export default function ShellSoft({ model, children }: { model: AppShellModel; children: ReactNode }) {
  const { t } = useTranslation()
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn("flex h-9 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
      isActive ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    cn("flex min-w-0 flex-col items-center gap-0.5 px-1 pt-2 pb-2 text-[11px]", isActive ? "font-semibold text-link" : "text-muted-foreground")

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="print:hidden sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 overflow-y-auto border-e border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground md:flex">
        <div className="flex items-center justify-between gap-2 px-2 pt-1 pb-3">
          <Wordmark className="text-lg" />
          <span className="flex min-w-0 items-center gap-1"><ShownCurrency model={model} /><SyncState model={model} /></span>
        </div>
        {model.canWrite && (
          <button type="button" onClick={() => model.setAdding(true)} data-tour="quick-add-desktop"
            className="mb-3 flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground transition-colors hover:bg-sidebar-primary/90 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none">
            <Plus className="size-5" /> {t("transactions.add")}
          </button>
        )}
        {model.sidebar.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
            <item.icon className="size-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
        {model.operator && (
          <NavLink to="/admin" className={navClass}>
            <ShieldCheck className="size-5 shrink-0" />
            <span className="truncate">{t("admin.nav")}</span>
          </NavLink>
        )}
        <div className="mt-auto flex items-center gap-2 border-t border-sidebar-border px-2 pt-3">
          <p className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/60">{model.householdName}</p>
          <button type="button" onClick={model.signOut} data-testid="sidebar-sign-out"
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none">
            <LogOut className="size-4 rtl:-scale-x-100" /> {t("auth.logout")}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 pb-28 md:px-9 md:pt-7 md:pb-12">
        <div className="mb-4 flex items-center justify-between gap-2 md:hidden">
          <Wordmark className="text-[22px]" />
          <span className="flex min-w-0 items-center gap-1"><ShownCurrency model={model} /><SyncState model={model} /></span>
        </div>
        {children}
      </main>

      {model.canWrite && (
        <button type="button" data-tour="quick-add" aria-label={t("transactions.add")} onClick={() => model.setAdding(true)}
          className="print:hidden fixed end-4 bottom-20 z-20 grid size-13 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sheet focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden">
          <Plus className="size-6" />
        </button>
      )}

      <nav className="print:hidden fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {model.primary.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={tabClass}>
            <item.icon className="size-5" />
            <span className="max-w-full truncate">{item.label}</span>
          </NavLink>
        ))}
        {!model.restricted && (
          <NavLink to="/more" data-tour="nav-more" className={tabClass}>
            <MoreHorizontal className="size-5" />
            <span className="max-w-full truncate">{t("nav.more")}</span>
          </NavLink>
        )}
      </nav>
    </div>
  )
}

function Wordmark({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={cn("flex items-center gap-2.5 font-semibold", className)}>
      <ScaleMark />
      {t("app.name")}
    </span>
  )
}

/** The canvas wordmark glyph: a beam on a post with a pan at each end, in gold. */
function ScaleMark() {
  return (
    <svg viewBox="0 0 28 20" className="h-5 w-7 shrink-0 text-gold" fill="currentColor" aria-hidden="true">
      <rect x="0" y="4" width="28" height="3" rx="1.5" />
      <rect x="12.5" y="0" width="3" height="8" rx="1.5" />
      <circle cx="5" cy="15" r="5" />
      <circle cx="23" cy="15" r="5" />
    </svg>
  )
}

/** While amounts are converted for display, say so, and let one tap turn it off. */
function ShownCurrency({ model }: { model: AppShellModel }) {
  const { t } = useTranslation()
  if (!model.shownCurrency) return null
  return (
    <button type="button" onClick={model.stopShowingCurrency} title={t("currency.showingOff")}
      className="inline-flex h-[22px] shrink-0 items-center rounded-full border border-border px-2 text-xs font-semibold">
      {t("currency.showing", { currency: model.shownCurrency })}
    </button>
  )
}

function SyncState({ model }: { model: AppShellModel }) {
  const { label, state } = model.sync
  const Icon = state === "error" ? CircleAlert : state === "busy" ? RefreshCw : CircleCheck
  return (
    <Link to="/sync" title={label}
      className={cn("inline-flex h-[22px] max-w-40 min-w-0 items-center gap-1 rounded-full px-2 text-xs font-semibold",
        state === "error" ? "bg-destructive-soft text-destructive" : state === "busy" ? "bg-warning-soft text-foreground" : "bg-success-soft text-success")}>
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}
