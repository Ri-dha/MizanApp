import { getLocales } from "expo-localization"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { register } from "@mizan/core/auth/session"
import type { AppMode } from "@mizan/core/domain/appMode"
import { IRAQ } from "@mizan/core/market/currency"
import { AppModeChoice } from "@/components/app-mode-choice"
import { AppStyleChoice } from "@/components/app-style-choice"
import { Button } from "@/components/button"
import { CountryField, CurrencyField } from "@/components/currency-field"
import { Notice } from "@/components/notice"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useCatalogue } from "@/hooks/use-currency"
import { applyLocal, usePreferences } from "@/preferences"
import { describeError } from "@/utils/errors"

const MIN_PASSWORD = 8

export function Register() {
  const { t, i18n } = useTranslation()
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

  return (
    <Screen>
      <TextField testID="display-name" label={t("auth.displayName")} autoComplete="name" maxLength={80} value={displayName} onChangeText={setDisplayName} />
      <TextField testID="register-identifier" label={t("auth.identifier")} autoCapitalize="none" autoComplete="username" keyboardType="email-address" value={identifier} onChangeText={setIdentifier} />
      <ThemedText variant="caption">{t("auth.identifierHint")}</ThemedText>
      <TextField testID="register-password" label={t("auth.password")} secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} />
      <CountryField testID="register-country" label={t("auth.country")} value={country} catalogue={catalogue} onChange={pickCountry} />
      <CurrencyField testID="register-currency" label={t("auth.baseCurrency")} value={currency} onChange={setCurrency} codes={catalogue?.currencies} />
      <ThemedText variant="caption">{t("auth.baseCurrencyHint")}</ThemedText>
      <ThemedText variant="subhead">{t("appMode.label")}</ThemedText>
      <AppModeChoice value={mode} onChange={setMode} />
      <ThemedText variant="subhead">{t("appStyle.label")}</ThemedText>
      {/* Applied at once, so the person sees the template before the account exists. */}
      <AppStyleChoice value={appStyle} onChange={(next) => applyLocal({ appStyle: next })} />
      {error ? <Notice tone="error" testID="register-error">{error}</Notice> : null}
      <Button testID="register" size="lg" title={t("auth.register")} loading={busy} disabled={!displayName || !identifier || password.length < MIN_PASSWORD} onPress={() => void submit()} />
    </Screen>
  )
}
