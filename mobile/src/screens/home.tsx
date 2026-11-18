import { useTranslation } from "react-i18next"
import { ActivityIndicator, View } from "react-native"

import { useRecoveryCodeToShow, useSession, useVaultState } from "@/hooks/use-core"
import { Ledger } from "./ledger"
import { RecoveryCode } from "./recovery-code"
import { SignIn } from "./sign-in"
import { Unlock } from "./unlock"

export function Home() {
  useTranslation()
  const session = useSession()
  const vault = useVaultState()
  const recoveryCode = useRecoveryCodeToShow()
  if (session === undefined) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>
  if (!session) return <SignIn />
  if (recoveryCode) return <RecoveryCode code={recoveryCode} />
  if (vault !== "ready") return <Unlock />
  return <Ledger />
}
