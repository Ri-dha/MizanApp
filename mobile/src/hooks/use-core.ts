import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { currentSession, subscribeSession, type LocalSession } from "@mizan/core/auth/session"
import { lockState, subscribeLock, type LockState } from "@mizan/core/lock/store"
import { subscribeSyncStatus, syncStatus, type SyncStatus } from "@mizan/core/sync/engine"
import { recoveryCodeToShow, subscribeVault, vaultState, type VaultState } from "@mizan/core/vault/account"
import { onStoreChange } from "@/platform/sqlite-store"

export const useSession = (): LocalSession | null | undefined => useSyncExternalStore(subscribeSession, currentSession)
export const useVaultState = (): VaultState => useSyncExternalStore(subscribeVault, vaultState)
export const useRecoveryCodeToShow = (): string | null => useSyncExternalStore(subscribeVault, recoveryCodeToShow)
export const useLockState = (): LockState => useSyncExternalStore(subscribeLock, lockState)
export const useSyncStatus = (): SyncStatus => useSyncExternalStore(subscribeSyncStatus, syncStatus)

/** The phone's live query: runs a core read and again after any local write (ADR mobile-4). */
export function useLiveQuery<T>(query: () => Promise<T>, deps: readonly unknown[], initial: T): T {
  const [value, setValue] = useState(initial)
  const latest = useRef(query)
  latest.current = query
  useEffect(() => {
    let cancelled = false
    let generation = 0
    const run = () => {
      const mine = ++generation
      void latest.current().then((next) => {
        if (!cancelled && mine === generation) setValue(next)
      })
    }
    run()
    const stop = onStoreChange(run)
    return () => {
      cancelled = true
      stop()
    }
  }, deps)
  return value
}
