import { Link, Stack, type Href } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet } from "react-native"

import { logout } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { colors, spacing } from "@/theme"

function LinkRow({ href, label, last, testID }: { href: Href; label: string; last?: boolean; testID: string }) {
  return (
    <Link href={href} asChild>
      <Pressable testID={testID} accessibilityRole="link" style={({ pressed }) => (pressed ? styles.pressed : null)}>
        <Row last={last} trailing={<ThemedText variant="subhead">›</ThemedText>}>
          <ThemedText>{label}</ThemedText>
        </Row>
      </Pressable>
    </Link>
  )
}

/** Everything that does not earn a tab; it grows as Phase 5 brings each web screen over. */
export function More() {
  const { t } = useTranslation()
  return (
    <Screen>
      <Stack.Screen options={{ title: t("nav.more") }} />
      <Group>
        <LinkRow testID="more-sync" href="/sync" label={t("nav.sync")} />
        <LinkRow testID="more-diagnostics" href="/diagnostics" label="Diagnostics" last />
      </Group>
      <Button testID="sign-out" variant="secondary" title={t("auth.logout")} style={styles.signOut} onPress={() => void logout()} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  pressed: { backgroundColor: colors.fill },
  signOut: { marginTop: spacing.md },
})
