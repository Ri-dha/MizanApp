import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, View } from "react-native"

import { updateProfile } from "@mizan/core/auth/profile"
import { rememberFromServer } from "@mizan/core/auth/session"
import { changeBaseCurrency } from "@mizan/core/db/rebase"
import { IRAQ, unitRate } from "@mizan/core/market/currency"
import { syncNow } from "@mizan/core/sync/engine"
import { Button } from "@/components/button"
import { CountryField, CurrencyField } from "@/components/currency-field"
import { Notice } from "@/components/notice"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useCatalogue } from "@/hooks/use-currency"
import { useMetals } from "@/hooks/use-views"
import { setPreferences, usePreferences } from "@/preferences"
import { spacing } from "@/theme"
import { describeError } from "@/utils/errors"

/** ADR currency-1: where the person lives, the household's currency (the owner changes it for everyone), and this device's display currency. */
export function CurrencySettings() {
  const { t } = useTranslation()
  const session = useSession()
  const catalogue = useCatalogue()
  const { prices } = useMetals()
  const { displayCurrency } = usePreferences()
  const base = session?.baseCurrency ?? "IQD"
  const owner = session?.role === "OWNER"
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

  return (
    <View style={styles.body}>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {message ? <Notice testID="currency-changed">{message}</Notice> : null}
      <CountryField testID="settings-country" label={t("auth.country")} value={session?.country ?? IRAQ} catalogue={catalogue} onChange={(c) => void changeCountry(c)} />
      {owner ? (
        <View style={styles.body}>
          <CurrencyField testID="settings-base-currency" label={t("auth.baseCurrency")} value={base} onChange={confirmBase} codes={catalogue?.currencies} />
          <ThemedText variant="caption">{busy ? t("common.loading") : t("currency.ownerHint")}</ThemedText>
        </View>
      ) : (
        <View style={styles.body}>
          <ThemedText variant="subhead">{t("auth.baseCurrency")}</ThemedText>
          <ThemedText testID="settings-base-currency-shown">{base}</ThemedText>
          <ThemedText variant="caption">{t("currency.notOwner")}</ThemedText>
        </View>
      )}
      <CurrencyField
        testID="settings-display-currency"
        label={t("currency.showIn")}
        value={displayCurrency ?? base}
        codes={Object.keys(prices.perUsd)}
        onChange={(code) => setPreferences({ displayCurrency: code === base ? null : code })}
      />
      <ThemedText variant="caption">{t("currency.showInHint", { base })}</ThemedText>
      {displayCurrency && displayCurrency !== base ? (
        <Button testID="settings-display-off" variant="ghost" title={t("currency.showingOff")} onPress={() => setPreferences({ displayCurrency: null })} style={styles.off} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm },
  off: { alignSelf: "flex-start" },
})
