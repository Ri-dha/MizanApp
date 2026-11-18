import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, View } from "react-native"

import { useRecoveryCodeToShow, useSession, useVaultState } from "@/hooks/use-core"
import { colors } from "@/theme"
import { Ledger } from "./ledger"
import { Recover } from "./recover"
import { RecoveryCode } from "./recovery-code"
import { SignIn } from "./sign-in"
import { Unlock } from "./unlock"

export function Home() {
  const { t } = useTranslation()
  const session = useSession()
  const vault = useVaultState()
  const recoveryCode = useRecoveryCodeToShow()
  if (session === undefined) return <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.background }}><ActivityIndicator /></View>
  if (session && !recoveryCode && vault === "ready") return <Ledger />
  return (
    <>
      <Stack.Screen options={{ title: t("app.name"), headerShown: false, headerRight: () => null }} />
      {!session ? <SignIn /> : recoveryCode ? <RecoveryCode code={recoveryCode} /> : vault === "needs-recovery" ? <Recover /> : <Unlock />}
    </>
  )
}
