import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { spacing, useAppStyle } from "@/theme"
import { useAccountsScreen } from "./use-accounts-screen"
import { AccountsSoft } from "./views/accounts-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: AccountsSoft }

export function Accounts() {
  const { t } = useTranslation()
  const model = useAccountsScreen()
  const Chosen = viewFor(VIEWS, useAppStyle())
  return (
    <Screen>
      <Stack.Screen options={{ title: t("accounts.title"), headerRight: () => (
        <View style={styles.actions}>
          {model.canTransfer ? <Button testID="open-transfer" variant="ghost" title={t("cashMovements.transfer")} onPress={model.transfer} /> : null}
          <Button testID="add-account" variant="ghost" title={t("accounts.add")} onPress={model.add} />
        </View>
      ) }} />
      <Chosen model={model} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: spacing.xs },
})
