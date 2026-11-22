import { getLocales } from "expo-localization"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { register } from "@mizan/core/auth/session"
import type { AppMode } from "@mizan/core/domain/appMode"
import type { AppStyle } from "@mizan/core/domain/appStyle"
import { IRAQ } from "@mizan/core/market/currency"
import { useCatalogue } from "@/hooks/use-currency"
import { applyLocal, usePreferences } from "@/preferences"
import { describeError } from "@/utils/errors"

const MIN_PASSWORD = 8

/** Everything the register screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useRegisterScreen() {
  const { i18n } = useTranslation()
  const [displayName, setDisplayName] = useState("")
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const catalogue = useCatalogue()
  const [country, setCountry] = useState(IRAQ)
  const [currency, setCurrency] = useState("IQD")
  const [mode, setMode] = useState<AppMode>("simple")
  const [busy, setBusy] = useState(false)
  const { appStyle } = usePreferences()
  const [error, setError] = useState<string | null>(null)

  const currencyOf = (code: string) => catalogue?.countries.find((c) => c.code === code)?.currency

  // A phone knows where it is set up; start there (once the catalogue arrives) when that country is offered.
  useEffect(() => {
    const region = getLocales()[0]?.regionCode
    const own = region ? currencyOf(region) : undefined
    if (region && own) {
      setCountry(region)
      setCurrency(own)
    }
  }, [catalogue])

  function pickCountry(code: string) {
    setCountry(code)
    setCurrency(currencyOf(code) ?? currency)
  }

  async function submit() {
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

  return {
    displayName, setDisplayName, identifier, setIdentifier, password, setPassword,
    catalogue, country, pickCountry, currency, setCurrency, mode, setMode, busy, error,
    appStyle,
    // Applied at once, so the person sees the template before the account exists.
    setAppStyle: (next: AppStyle) => applyLocal({ appStyle: next }),
    canSubmit: !!displayName && !!identifier && password.length >= MIN_PASSWORD,
    submit: () => void submit(),
  }
}

export type RegisterScreenModel = ReturnType<typeof useRegisterScreen>
