import { Stack, type Href } from "expo-router"
import { useTranslation } from "react-i18next"
import { StyleSheet } from "react-native"

import { logout } from "@mizan/core/auth/session"
import { Button } from "@/components/button"
import { LinkRow } from "@/components/link-row"
import { Group } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { spacing } from "@/theme"
import { audienceOf, type Audience } from "@/utils/roles"

interface Destination {
  id: string
  href: Href
  label: string
  audiences: Audience[]
}

const EVERYONE: Audience[] = ["FULL", "DEPENDENT", "ADVISOR"]
const MEMBERS: Audience[] = ["FULL"]

/** Everything that does not earn a tab, trimmed to what the signed-in role may open. */
export function More() {
  const { t } = useTranslation()
  const audience = audienceOf(useSession())
  const destinations: Destination[] = [
    { id: "goals", href: "/goals", label: t("nav.goals"), audiences: ["FULL", "DEPENDENT"] },
    { id: "networth", href: "/networth", label: t("nav.networth"), audiences: MEMBERS },
    { id: "report", href: "/report", label: t("nav.report"), audiences: MEMBERS },
    { id: "accounts", href: "/accounts", label: t("nav.accounts"), audiences: MEMBERS },
    { id: "metals", href: "/metals", label: t("nav.metals"), audiences: MEMBERS },
    { id: "assets", href: "/assets", label: t("nav.assets"), audiences: MEMBERS },
    { id: "income", href: "/income", label: t("nav.income"), audiences: MEMBERS },
    { id: "bills", href: "/bills", label: t("nav.bills"), audiences: MEMBERS },
    { id: "debts", href: "/debts", label: t("nav.debts"), audiences: MEMBERS },
    { id: "prices", href: "/prices", label: t("nav.prices"), audiences: EVERYONE },
    { id: "household", href: "/household", label: t("household.title"), audiences: EVERYONE },
    { id: "help", href: "/help", label: t("help.title"), audiences: EVERYONE },
    { id: "settings", href: "/settings", label: t("nav.settings"), audiences: EVERYONE },
    { id: "sync", href: "/sync", label: t("nav.sync"), audiences: EVERYONE },
    ...(__DEV__ ? [{ id: "diagnostics", href: "/diagnostics", label: "Diagnostics", audiences: EVERYONE } satisfies Destination] : []),
  ]
  const shown = destinations.filter((d) => d.audiences.includes(audience))
  return (
    <Screen>
      <Stack.Screen options={{ title: t("nav.more") }} />
      <Group>
        {shown.map((d, index) => (
          <LinkRow key={d.id} testID={`more-${d.id}`} href={d.href} last={index === shown.length - 1}><ThemedText>{d.label}</ThemedText></LinkRow>
        ))}
      </Group>
      <Button testID="sign-out" variant="secondary" title={t("auth.logout")} style={styles.signOut} onPress={() => void logout()} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  signOut: { marginTop: spacing.md },
})
