import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import type { AppMode } from "@mizan/core/domain/appMode"
import type { AppStyle } from "@mizan/core/domain/appStyle"
import { IRAQ } from "@mizan/core/market/currency"
import { register } from "@/api/auth"
import { describeError } from "@/app/errors"
import { applyLocal, preferences } from "@/app/preferences"
import { useCatalogue } from "@/features/currency/useCurrencies"

export function useRegisterPage() {
  const { i18n } = useTranslation()
  const [identifier, setIdentifier] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const catalogue = useCatalogue()
  const [country, setCountryCode] = useState(IRAQ)
  const [currency, setCurrency] = useState("IQD")
  const [mode, setMode] = useState<AppMode>("simple")
  const [style, setStyleValue] = useState<AppStyle>(() => preferences().appStyle)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register(identifier, password, displayName, i18n.language.startsWith("ar") ? "ar" : "en", country, currency)
      // Kept on this device now; it reaches the person's synced row once the first sync has run (ADR home-2).
      applyLocal({ appMode: mode, appStyle: style })
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  function setCountry(code: string) {
    setCountryCode(code)
    setCurrency(catalogue?.countries.find((c) => c.code === code)?.currency ?? currency)
  }

  // Applied at once, so the person sees the template before the account exists.
  function setStyle(next: AppStyle) {
    setStyleValue(next)
    applyLocal({ appStyle: next })
  }

  return {
    identifier, setIdentifier, displayName, setDisplayName, password, setPassword,
    catalogue, country, setCountry, currency, setCurrency, mode, setMode, style, setStyle,
    error, busy, submit,
  }
}

export type RegisterPageModel = ReturnType<typeof useRegisterPage>
