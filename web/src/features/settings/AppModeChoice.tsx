import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { APP_MODES, type AppMode } from "@mizan/core/domain/appMode"

/** ADR mode-1: the two modes side by side, each saying what it shows. */
export function AppModeChoice({ value, onChange }: { value: AppMode; onChange: (mode: AppMode) => void }) {
  const { t } = useTranslation()
  return (
    <div role="radiogroup" aria-label={t("appMode.label")} className="grid gap-2 sm:grid-cols-2">
      {APP_MODES.map((mode) => (
        <button key={mode} type="button" role="radio" aria-checked={value === mode} onClick={() => onChange(mode)}
          className={cn("flex flex-col gap-1 rounded-lg border p-3 text-start", value === mode ? "border-primary bg-primary/10" : "bg-card")}>
          <span className="font-semibold">{t(`appMode.modes.${mode}`)}</span>
          <span className="text-sm opacity-70">{t(`appMode.hints.${mode}`)}</span>
        </button>
      ))}
    </div>
  )
}
