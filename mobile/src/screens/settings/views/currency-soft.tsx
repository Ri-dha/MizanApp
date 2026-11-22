import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { CountryField, CurrencyField } from "@/components/currency-field"
import { Notice } from "@/components/notice"
import { Card } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { CurrencyScreenModel } from "../use-currency-screen"

/** Soft: one card for where the person lives and the household's currency, a second for what this device shows. */
export function CurrencySoft({ model }: { model: CurrencyScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <View style={styles.body}>
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
      {model.message ? <Notice testID="currency-changed">{model.message}</Notice> : null}
      <Card>
        <CountryField testID="settings-country" label={t("auth.country")} value={model.country} catalogue={model.catalogue} onChange={model.changeCountry} />
        {model.owner ? (
          <View style={styles.field}>
            <CurrencyField testID="settings-base-currency" label={t("auth.baseCurrency")} value={model.base} onChange={model.confirmBase} codes={model.catalogue?.currencies} />
            <ThemedText variant="caption">{model.busy ? t("common.loading") : t("currency.ownerHint")}</ThemedText>
          </View>
        ) : (
          <View style={styles.field}>
            <ThemedText variant="subhead">{t("auth.baseCurrency")}</ThemedText>
            <ThemedText testID="settings-base-currency-shown" style={styles.shown}>{model.base}</ThemedText>
            <ThemedText variant="caption">{t("currency.notOwner")}</ThemedText>
          </View>
        )}
      </Card>
      <Card>
        <CurrencyField testID="settings-display-currency" label={t("currency.showIn")} value={model.display} codes={model.displayCodes} onChange={model.setDisplay} />
        <ThemedText variant="caption">{t("currency.showInHint", { base: model.base })}</ThemedText>
        {model.showingOther ? <Button testID="settings-display-off" variant="ghost" title={t("currency.showingOff")} onPress={model.displayOff} style={styles.off} /> : null}
      </Card>
    </View>
  )
}

const useStyles = makeStyles(() => ({
  body: { gap: spacing.sm },
  field: { gap: spacing.xs },
  shown: { fontWeight: "600" },
  off: { alignSelf: "flex-start" },
}))
