import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { AppModeChoice } from "@/components/app-mode-choice"
import { AppStyleChoice } from "@/components/app-style-choice"
import { Button } from "@/components/button"
import { CountryField, CurrencyField } from "@/components/currency-field"
import { Notice } from "@/components/notice"
import { Card, Section } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { RegisterScreenModel } from "../use-register-screen"

/** Soft: who you are in one card, where you count in another, then the two choices under their own headings and one wide button. */
export function RegisterSoft({ model }: { model: RegisterScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Card style={styles.form}>
        <TextField testID="display-name" label={t("auth.displayName")} autoComplete="name" maxLength={80} value={model.displayName} onChangeText={model.setDisplayName} />
        <View style={styles.field}>
          <TextField testID="register-identifier" label={t("auth.identifier")} autoCapitalize="none" autoComplete="username" keyboardType="email-address" value={model.identifier} onChangeText={model.setIdentifier} />
          <ThemedText variant="caption">{t("auth.identifierHint")}</ThemedText>
        </View>
        <TextField testID="register-password" label={t("auth.password")} secureTextEntry autoComplete="new-password" value={model.password} onChangeText={model.setPassword} />
      </Card>
      <Card style={styles.form}>
        <CountryField testID="register-country" label={t("auth.country")} value={model.country} catalogue={model.catalogue} onChange={model.pickCountry} />
        <View style={styles.field}>
          <CurrencyField testID="register-currency" label={t("auth.baseCurrency")} value={model.currency} onChange={model.setCurrency} codes={model.catalogue?.currencies} />
          <ThemedText variant="caption">{t("auth.baseCurrencyHint")}</ThemedText>
        </View>
      </Card>
      <Section title={t("appMode.label")}>
        <AppModeChoice value={model.mode} onChange={model.setMode} />
      </Section>
      <Section title={t("appStyle.label")}>
        <AppStyleChoice value={model.appStyle} onChange={model.setAppStyle} />
      </Section>
      {model.error ? <Notice tone="error" testID="register-error">{model.error}</Notice> : null}
      <Button testID="register" size="lg" title={t("auth.register")} loading={model.busy} disabled={!model.canSubmit} onPress={model.submit} />
    </>
  )
}

const useStyles = makeStyles(() => ({
  form: { gap: spacing.sm + spacing.xs },
  field: { gap: spacing.xs },
}))
