import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { register } from "@/api/auth"
import { describeError } from "@/app/errors"
import { AuthLayout } from "@/components/AuthLayout"
import { Field } from "@/components/Field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CountrySelect } from "@/features/currency/CountrySelect"
import { CurrencySelect } from "@/features/currency/CurrencySelect"
import { useCatalogue } from "@/features/currency/useCurrencies"
import { IRAQ } from "@mizan/core/market/currency"
import type { AppMode } from "@mizan/core/domain/appMode"
import { applyLocal } from "@/app/preferences"
import { AppModeChoice } from "@/features/settings/AppModeChoice"
import { Label } from "@/components/ui/label"

export function RegisterPage() {
  const { t, i18n } = useTranslation()
  const [identifier, setIdentifier] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const catalogue = useCatalogue()
  const [country, setCountry] = useState(IRAQ)
  const [currency, setCurrency] = useState("IQD")
  const [mode, setMode] = useState<AppMode>("simple")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register(identifier, password, displayName, i18n.language.startsWith("ar") ? "ar" : "en", country, currency)
      // Kept on this device now; it reaches the person's synced row once the first sync has run (ADR home-2).
      applyLocal({ appMode: mode })
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title={t("auth.register")}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field id="displayName" label={t("auth.displayName")}>
          <Input id="displayName" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={80} />
        </Field>
        <Field id="country" label={t("auth.country")}>
          <CountrySelect id="country" value={country} catalogue={catalogue} onChange={(code) => {
            setCountry(code)
            setCurrency(catalogue?.countries.find((c) => c.code === code)?.currency ?? currency)
          }} />
        </Field>
        <Field id="currency" label={t("auth.baseCurrency")} hint={t("auth.baseCurrencyHint")}>
          <CurrencySelect id="currency" value={currency} onChange={setCurrency} codes={catalogue?.currencies} />
        </Field>
        <Field id="identifier" label={t("auth.identifier")} hint={t("auth.identifierHint")}>
          <Input id="identifier" type="email" dir="ltr" autoComplete="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        </Field>
        <Field id="password" label={t("auth.password")}>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <Label>{t("appMode.label")}</Label>
          <AppModeChoice value={mode} onChange={setMode} />
        </div>
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" disabled={busy}>{t("auth.register")}</Button>
        <Link to="/login" className="text-sm underline">{t("auth.haveAccount")} {t("auth.login")}</Link>
      </form>
    </AuthLayout>
  )
}
