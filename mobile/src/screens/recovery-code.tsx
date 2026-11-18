import { useTranslation } from "react-i18next"
import { Button, StyleSheet, Text, View } from "react-native"

import { acknowledgeRecoveryCode } from "@mizan/core/vault/account"

export function RecoveryCode({ code }: { code: string }) {
  const { t } = useTranslation()
  return (
    <View style={styles.page}>
      <Text style={styles.title}>{t("vault.recoveryTitle")}</Text>
      <Text selectable testID="recovery-code" style={styles.code}>{code}</Text>
      <Button testID="recovery-saved" title={t("vault.recoverySaved")} onPress={() => void acknowledgeRecoveryCode()} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: "600" },
  code: { fontFamily: "Menlo", fontSize: 18, letterSpacing: 1 },
})
