import type { ReactNode } from "react"

import { useLockState, useRecoveryCodeToShow, useSession, useVaultState } from "@/hooks/use-core"
import { LockScreen } from "@/screens/lock-screen"
import { SetPin } from "@/screens/set-pin"

/**
 * FR-ACC-03: once the keys are open, nothing below the root renders until the lock is open, so
 * a sheet or screen left open when the app locked is not reachable behind the lock screen.
 */
export function LockGate({ children }: { children: ReactNode }) {
  const session = useSession()
  const vault = useVaultState()
  const recoveryCode = useRecoveryCodeToShow()
  const lock = useLockState()
  const guarded = !!session && vault === "ready" && !recoveryCode
  if (guarded && lock === "no-pin") return <SetPin />
  if (guarded && lock !== "unlocked") return <LockScreen />
  return children
}
