import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { updateProfile } from "@mizan/core/auth/profile"
import { rememberFromServer } from "@mizan/core/auth/session"
import { changeBaseCurrency } from "@mizan/core/db/rebase"
import { IRAQ, unitRate } from "@mizan/core/market/currency"
import { syncNow } from "@mizan/core/sync/engine"
import { useSession } from "@/hooks/use-core"
import { useCatalogue } from "@/hooks/use-currency"
import { useMetals } from "@/hooks/use-views"
import { setPreferences, usePreferences } from "@/preferences"
import { describeError } from "@/utils/errors"

/** ADR currency-1: where the person lives, the household's currency (the owner changes it for everyone), and this device's display currency. */
export function useCurrencyScreen() {
  const { t } = useTranslation()
  const session = useSession()
  const catalogue = useCatalogue()
  const { prices } = useMetals()
  const { displayCurrency } = usePreferences()
  const base = session?.baseCurrency ?? "IQD"
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function changeCountry(country: string) {
    setError(null)
    try {
      await updateProfile({ country })
    } catch (e) {
      setError(describeError(e))
    }
  }

  function confirmBase(next: string) {
    const factor = unitRate(base, next, prices.perUsd)
    const title = t("currency.confirmTitle", { from: base, to: next })
    if (factor === null) {
      Alert.alert(title, t("currency.noRate", { from: base, to: next }))
      return
    }
    Alert.alert(title, t("currency.confirmBody", { from: base, to: next, rate: Number(factor.toPrecision(6)) }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("currency.change"), style: "destructive", onPress: () => void changeBase(next, factor) },
    ])
  }

  async function changeBase(next: string, factor: number) {
    if (!session) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      // Anything still waiting on this device goes up first, so it is converted with the rest.
      await syncNow()
      await changeBaseCurrency(session, next, factor)
      await rememberFromServer(null)
      void syncNow()
      setMessage(t("currency.changed", { currency: next }))
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return {
    error, message, busy, base, catalogue,
    owner: session?.role === "OWNER",
    country: session?.country ?? IRAQ,
    changeCountry: (country: string) => void changeCountry(country),
    confirmBase,
    display: displayCurrency ?? base,
    displayCodes: Object.keys(prices.perUsd),
    setDisplay: (code: string) => setPreferences({ displayCurrency: code === base ? null : code }),
    showingOther: !!displayCurrency && displayCurrency !== base,
    displayOff: () => setPreferences({ displayCurrency: null }),
  }
}

export type CurrencyScreenModel = ReturnType<typeof useCurrencyScreen>
