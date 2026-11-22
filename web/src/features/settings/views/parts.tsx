import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export const softCard = "flex min-w-0 scroll-mt-4 flex-col gap-3 rounded-[10px] border border-border bg-card p-5 shadow-card"

export function Section({ id, icon: Icon, title, tour, children }: { id: string; icon: LucideIcon; title: string; tour?: string; children: ReactNode }) {
  return (
    <section id={id} data-tour={tour} className={softCard}>
      <h2 className="flex items-center gap-2 text-base leading-[22px] font-semibold"><Icon className="size-5 shrink-0 text-link" />{title}</h2>
      {children}
    </section>
  )
}

/** One choice out of a few, all visible at once; the canvas uses it where the old page had a dropdown. */
export function Segmented<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={`${id}-label`}>{label}</Label>
      <div id={id} role="radiogroup" aria-labelledby={`${id}-label`} className="flex max-w-full flex-wrap gap-0.5 self-start rounded-[9px] bg-muted p-0.5">
        {options.map((option) => (
          <button key={option.value} type="button" role="radio" aria-checked={option.value === value} onClick={() => onChange(option.value)}
            className={cn("rounded-[7px] px-3 text-[13px] leading-7 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              option.value === value ? "bg-card font-semibold shadow-card" : "text-foreground/80 hover:text-foreground")}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A setting as a row: what it does at the start, its switch at the end. */
export function ToggleRow({ id, label, checked, onChange, disabled, children }: { id: string; label: string; checked: boolean; onChange: (on: boolean) => void; disabled?: boolean; children?: ReactNode }) {
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-3">
      <Label htmlFor={id} className="min-w-0 flex-1 text-sm font-normal">{label}</Label>
      {children}
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
