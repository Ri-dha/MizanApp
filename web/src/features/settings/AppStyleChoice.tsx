import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { APP_STYLES, type AppStyle } from "@mizan/core/domain/appStyle"

/** ADR styles-1: the templates side by side; each swatch wears its own template's colours. */
export function AppStyleChoice({ value, onChange }: { value: AppStyle; onChange: (style: AppStyle) => void }) {
  const { t } = useTranslation()
  return (
    <div role="radiogroup" aria-label={t("appStyle.label")} className="grid gap-2 sm:grid-cols-3">
      {APP_STYLES.map((style) => (
        <button key={style} type="button" role="radio" aria-checked={value === style} onClick={() => onChange(style)}
          className={cn("flex flex-col gap-2 rounded-lg border p-3 text-start", value === style ? "border-primary bg-info-soft" : "bg-card")}>
          <span data-style={style} aria-hidden className="flex h-16 overflow-hidden rounded-md border border-border bg-background">
            <span className="w-1/4 bg-sidebar p-1.5"><span className="block h-2 rounded-sm bg-sidebar-primary" /></span>
            <span className="flex flex-1 flex-col gap-1 p-1.5">
              <span className="h-5 rounded-sm bg-hero" />
              <span className="flex gap-1">
                <span className="h-3 flex-1 rounded-sm bg-card" />
                <span className="h-3 w-5 rounded-sm bg-primary" />
              </span>
            </span>
          </span>
          <span className="font-semibold">{t(`appStyle.styles.${style}`)}</span>
          <span className="text-sm text-muted-foreground">{t(`appStyle.hints.${style}`)}</span>
        </button>
      ))}
    </div>
  )
}
