import * as Clipboard from "expo-clipboard"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import { acknowledgeRecoveryCode } from "@mizan/core/vault/account"
import { Button } from "@/components/button"
import { Group } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { spacing, type } from "@/theme"

export function RecoveryCode({ code }: { code: string }) {
  const { t } = useTranslation()
  return (
    <Screen centered>
      <ThemedText variant="title">{t("vault.recoveryTitle")}</ThemedText>
      <Group>
        <ThemedText selectable testID="recovery-code" style={styles.code}>{code}</ThemedText>
      </Group>
      <Button variant="secondary" title={t("vault.copy")} onPress={() => void Clipboard.setStringAsync(code)} />
      <Button testID="recovery-saved" size="lg" title={t("vault.recoverySaved")} onPress={() => void acknowledgeRecoveryCode()} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  code: { ...type.code, padding: spacing.md, textAlign: "center" },
})
