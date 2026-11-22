import type { ComponentType, ReactNode } from "react"

import { cn } from "@/lib/utils"

/** The Soft template's card, hero card and row; shared by the net-worth, cash, assets, metals, prices, debts and goals views. */
export const card = "flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card"
export const heroCard = "flex min-w-0 flex-col gap-3 rounded-xl bg-card p-5 shadow-sheet"
export const row = "flex items-center gap-3 border-t border-border py-3 first:border-t-0"
export const eyebrow = "text-[13px] font-semibold text-muted-foreground"
export const meta = "text-[13px] text-muted-foreground"
export const cardTitle = "text-base font-semibold"
export const amountHero = "text-[34px] leading-10 font-bold tracking-tight tabular-nums"
export const amountLarge = "text-[26px] leading-8 font-semibold tabular-nums"

export type Tone = "ok" | "warn" | "bad" | "neutral" | "gold"

const PILL: Record<Tone, string> = {
  ok: "bg-success-soft text-success",
  warn: "bg-warning-soft text-warning",
  bad: "bg-destructive-soft text-destructive",
  neutral: "bg-muted text-muted-foreground",
  gold: "bg-gold-soft text-foreground",
}

export function Pill({ tone = "neutral", icon: Icon, className, children }: { tone?: Tone; icon?: ComponentType<{ className?: string }>; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold whitespace-nowrap", PILL[tone], className)}>
      {Icon && <Icon className="size-3.5" />}{children}
    </span>
  )
}

export function Lead({ icon: Icon, className }: { icon: ComponentType<{ className?: string }>; className?: string }) {
  return <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground", className)}><Icon className="size-5" /></span>
}

export function PageTop({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <h1 className="min-w-0 flex-1 text-3xl">{title}</h1>
      {children}
    </div>
  )
}

export interface Share { key: string; label: string; percent: number; fill: string }

export function ShareBar({ shares }: { shares: Share[] }) {
  const shown = shares.filter((share) => share.percent > 0)
  if (shown.length === 0) return null
  return (
    <>
      <div className="flex h-3 gap-[3px]" aria-hidden>
        {shown.map((share) => <span key={share.key} className={cn("rounded-full", share.fill)} style={{ width: `${share.percent}%` }} />)}
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
        {shown.map((share) => <span key={share.key} className="inline-flex items-center gap-1.5"><i className={cn("size-2.5 rounded-full", share.fill)} />{share.label} <span className="tabular-nums">{share.percent}%</span></span>)}
      </div>
    </>
  )
}

export function Progress({ percent, tone = "ok", className }: { percent: number; tone?: "ok" | "warn" | "primary"; className?: string }) {
  const fill = tone === "ok" ? "bg-success" : tone === "warn" ? "bg-warning" : "bg-primary"
  return <div className={cn("h-2.5 overflow-hidden rounded-full bg-muted", className)}><div className={cn("h-full rounded-full", fill)} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div>
}
