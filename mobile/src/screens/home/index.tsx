import { Link, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable } from "react-native"

import { staleAssets } from "@mizan/core/db/assets"
import { todayIso } from "@mizan/core/domain/calendar/month"
import { Announcements } from "@/components/announcements"
import { LinkRow } from "@/components/link-row"
import { Notice } from "@/components/notice"
import { Group } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useHomeLayout } from "@/hooks/use-home-layout"
import { useNetWorth } from "@/hooks/use-views"
import { usePreferences } from "@/preferences"
import { HomeCards } from "./widgets"
import { useScreenTour } from "@/tours"

export function Home() {
  const { t } = useTranslation()
  useScreenTour("welcome")
  const session = useSession()
  const layout = useHomeLayout()
  const prefs = usePreferences()
  const worth = useNetWorth()
  const stale = staleAssets(worth.assets, worth.valuations, todayIso(), prefs.valuationReminderMonths)
  return (
    <Screen>
      <Stack.Screen options={{ title: t("home.greeting", { name: session?.displayName ?? "" }) }} />
      {session && !session.verified ? (
        <Link href="/verify" asChild>
          <Pressable testID="open-verify" accessibilityRole="link">
            <Notice>{`${t("auth.verifyTitle")} · ${t("auth.verify")}`}</Notice>
          </Pressable>
        </Link>
      ) : null}
      <Announcements />
      {stale.length > 0 ? (
        <Link href="/assets" asChild>
          <Pressable testID="open-stale-assets" accessibilityRole="link">
            <Notice>{t("assets.stalePrompt", { count: stale.length, name: stale[0].name, months: prefs.valuationReminderMonths })}</Notice>
          </Pressable>
        </Link>
      ) : null}
      <HomeCards layout={layout} />
      <Group>
        <LinkRow testID="customise-home" href="/home-layout" last><ThemedText>{t("homeLayout.customise")}</ThemedText></LinkRow>
      </Group>
    </Screen>
  )
}

