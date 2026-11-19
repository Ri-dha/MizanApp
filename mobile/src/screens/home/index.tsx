import { Link, Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { Pressable } from "react-native"

import { LinkRow } from "@/components/link-row"
import { Notice } from "@/components/notice"
import { Group } from "@/components/row"
import { Screen } from "@/components/screen"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { useHomeLayout } from "@/hooks/use-home-layout"
import { HomeCards } from "./widgets"

export function Home() {
  const { t } = useTranslation()
  const session = useSession()
  const layout = useHomeLayout()
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
      <HomeCards layout={layout} />
      <Group>
        <LinkRow testID="customise-home" href="/home-layout" last><ThemedText>{t("homeLayout.customise")}</ThemedText></LinkRow>
      </Group>
    </Screen>
  )
}

