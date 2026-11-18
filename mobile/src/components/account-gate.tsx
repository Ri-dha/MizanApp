import type { ReactNode } from "react"

import { useLockState, useRecoveryCodeToShow, useSession, useVaultState } from "@/hooks/use-core"
import { LockScreen } from "@/screens/lock-screen"
import { Recover } from "@/screens/recover"
import { RecoveryCode } from "@/screens/recovery-code"
import { SetPin } from "@/screens/set-pin"
import { Unlock } from "@/screens/unlock"

/**
 * Between signing in and using the app sit states that are not places to navigate to: a new
 * recovery code to save, keys to open, a PIN to set or enter. Nothing under the root renders
 * until they are done, so a screen left open when the app locked is not reachable behind them
 * (FR-ACC-03).
 */
export function AccountGate({ children }: { children: ReactNode }) {
  const session = useSession()
  const vault = useVaultState()
  const recoveryCode = useRecoveryCodeToShow()
  const lock = useLockState()
  if (!session) return children
  if (recoveryCode) return <RecoveryCode code={recoveryCode} />
  if (vault === "needs-recovery") return <Recover />
  if (vault !== "ready") return <Unlock />
  if (lock === "no-pin") return <SetPin />
  if (lock !== "unlocked") return <LockScreen />
  return children
}
