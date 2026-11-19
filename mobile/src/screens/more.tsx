import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import { logout } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { Group } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { spacing } from "@/theme"

/** Everything that does not earn a tab; it grows as Phase 5 brings each web screen over. */
export function More() {
  const { t } = useTranslation()
  return (
    <Screen>
      <Stack.Screen options={{ title: t("nav.more") }} />
      <Group>
        <LinkRow testID="more-goals" href="/goals"><ThemedText>{t("nav.goals")}</ThemedText></LinkRow>
        <LinkRow testID="more-accounts" href="/accounts"><ThemedText>{t("nav.accounts")}</ThemedText></LinkRow>
        <LinkRow testID="more-metals" href="/metals"><ThemedText>{t("nav.metals")}</ThemedText></LinkRow>
        <LinkRow testID="more-income" href="/income"><ThemedText>{t("nav.income")}</ThemedText></LinkRow>
        <LinkRow testID="more-bills" href="/bills"><ThemedText>{t("nav.bills")}</ThemedText></LinkRow>
        <LinkRow testID="more-debts" href="/debts"><ThemedText>{t("nav.debts")}</ThemedText></LinkRow>
        <LinkRow testID="more-sync" href="/sync"><ThemedText>{t("nav.sync")}</ThemedText></LinkRow>
        <LinkRow testID="more-diagnostics" href="/diagnostics" last><ThemedText>Diagnostics</ThemedText></LinkRow>
      </Group>
      <Button testID="sign-out" variant="secondary" title={t("auth.logout")} style={styles.signOut} onPress={() => void logout()} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  signOut: { marginTop: spacing.md },
})
