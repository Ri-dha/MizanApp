import { RefreshCw, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { InstallButton } from "@/components/InstallButton"
import { LanguageToggle } from "@/components/LanguageToggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export const authCard = "flex w-full flex-col gap-4.5 rounded-xl bg-card p-6 shadow-sheet sm:p-8"
export const authLink = "font-medium text-link underline-offset-4 hover:underline"
export const authInput = "h-10"
export const authSubmit = "h-10 w-full text-[15px]"

export function ScaleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={cn("h-5 w-7 shrink-0 text-gold", className)} fill="currentColor" aria-hidden="true">
      <rect x="0" y="4" width="28" height="3" rx="1.5" />
      <rect x="12.5" y="0" width="3" height="8" rx="1.5" />
      <circle cx="5" cy="15" r="5" />
      <circle cx="23" cy="15" r="5" />
    </svg>
  )
}

function Tools() {
  return (
    <div className="flex items-center gap-2">
      <InstallButton variant="outline" size="sm" />
      <LanguageToggle />
    </div>
  )
}

export function AuthHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div>
      <h1 className="text-[22px] leading-7 font-semibold">{title}</h1>
      {body && <p className="text-sm text-muted-foreground">{body}</p>}
    </div>
  )
}

export function AuthError({ children }: { children: ReactNode }) {
  if (!children) return null
  return <Alert><AlertDescription>{children}</AlertDescription></Alert>
}

/** Soft sign-in: the brand panel beside the form, stacking with the form first on a narrow screen. */
export function AuthSplit({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col-reverse lg:flex-row">
      <section className="flex flex-col justify-between gap-7 bg-primary p-8 text-primary-foreground lg:flex-1 lg:p-14">
        <span className="flex items-center gap-3 text-[22px] font-semibold"><ScaleMark className="h-7 w-10" />{t("app.name")}</span>
        <div className="flex max-w-[520px] flex-col gap-4">
          <p className="text-3xl leading-tight font-semibold tracking-tight text-balance lg:text-[44px] lg:leading-[52px]">{t("app.tagline")}</p>
          <p className="text-[17px] leading-[26px] opacity-90">{t("auth.brandBody")}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm opacity-90">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-5" />{t("auth.brandEncrypted")}</span>
          <span className="flex items-center gap-1.5"><RefreshCw className="size-5" />{t("auth.brandOffline")}</span>
        </div>
      </section>
      <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex w-full max-w-[400px] flex-col gap-5">
          <div className="flex justify-end"><Tools /></div>
          <div className={authCard}>{children}</div>
        </div>
      </section>
    </div>
  )
}

/** Soft register: one centred column under the wordmark, wide enough for two fields side by side. */
export function AuthColumn({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col items-center gap-5 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex w-full max-w-[520px] items-center justify-between gap-2.5">
        <span className="flex items-center gap-2.5 text-xl font-semibold"><ScaleMark />{t("app.name")}</span>
        <Tools />
      </div>
      <div className={cn(authCard, "max-w-[520px]")}>{children}</div>
    </div>
  )
}
