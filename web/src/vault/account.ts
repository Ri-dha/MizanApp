import { useSyncExternalStore } from "react"

import { recoveryCodeToShow, recoveryReminderShown, subscribeVault, vaultState, type VaultState } from "@mizan/core/vault/account"

export * from "@mizan/core/vault/account"

export function useVaultState(): VaultState {
  return useSyncExternalStore(subscribeVault, vaultState)
}

export function useRecoveryCodeToShow(): string | null {
  return useSyncExternalStore(subscribeVault, recoveryCodeToShow)
}

export function useRecoveryReminder(): boolean {
  return useSyncExternalStore(subscribeVault, recoveryReminderShown)
}
