import { Link } from "expo-router"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, type } from "@/theme"
import type { SignInScreenModel } from "../use-sign-in-screen"
import { FrontIntro } from "./front-parts"

/** Soft: the mark, name and tagline at the start edge, the two fields, one wide button, the two links, and the encryption line last. */
export function SignInSoft({ model }: { model: SignInScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <FrontIntro title={t("app.name")} body={t("app.tagline")} />
      <View style={styles.field}>
        <TextField testID="identifier" label={t("auth.identifier")} autoCapitalize="none" autoComplete="username" keyboardType="email-address" value={model.identifier} onChangeText={model.setIdentifier} />
        <ThemedText variant="caption">{t("auth.identifierHint")}</ThemedText>
      </View>
      <TextField testID="password" label={t("auth.password")} secureTextEntry autoComplete="current-password" value={model.password} onChangeText={model.setPassword} onSubmitEditing={model.submit} />
      {model.error ? <Notice tone="error" testID="sign-in-error">{model.error}</Notice> : null}
      <Button testID="sign-in" title={t("auth.login")} size="lg" loading={model.busy} disabled={!model.canSubmit} onPress={model.submit} />
      <View style={styles.links}>
        <Link href="/register" testID="open-register" style={[type.body, styles.link]}>{`${t("auth.noAccount")} ${t("auth.register")}`}</Link>
        <Link href="/reset" testID="open-reset" style={[type.body, styles.link]}>{t("auth.forgot")}</Link>
      </View>
      <ThemedText variant="caption" style={styles.foot}>{t("auth.encrypted")}</ThemedText>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  field: { gap: spacing.xs },
  links: { gap: spacing.md, marginTop: spacing.sm, alignItems: "center" },
  link: { color: colors.link },
  foot: { textAlign: "center", marginTop: spacing.md },
}))
