import * as Device from "expo-device"

import { clearLocalData, installAuth, loadSession, refreshProfile, rememberFromServer } from "@mizan/core/auth/session"
import { META_KEYS } from "@mizan/core/db/meta"
import { resetLock } from "@mizan/core/lock/store"
import { refreshQuotes } from "@mizan/core/market/prices"
import { startSyncEngine } from "@mizan/core/sync/engine"
import { onVaultReady, vaultReady } from "@mizan/core/vault/account"
import { forgetTokens, keepTokens, refreshAccessToken } from "./api-client"
import { appLifecycle } from "./app-lifecycle"

export function installAuthHost() {
  installAuth({
    acceptTokens: ({ accessToken, refreshToken }) => keepTokens(accessToken, refreshToken),
    forgetTokens,
    refreshTokens: refreshAccessToken,
    resetLock,
    lockMetaKeys: () => [META_KEYS.pin, META_KEYS.biometric, META_KEYS.lockAfterSeconds],
  })
}

/** ADR mobile-3: the phone's host around core's sync loop. Receipt photos and backups come in Phase 5. */
export function startSync() {
  startSyncEngine({
    lifecycle: appLifecycle,
    loadSession,
    refreshProfile,
    vaultReady,
    onVaultReady,
    async onKeysReplaced() {
      await clearLocalData()
      await rememberFromServer(null)
    },
    deviceName: () => `${Device.modelName ?? "Phone"} app`,
    afterDuties: async () => {},
    afterSync: async () => {
      await refreshQuotes()
    },
  })
}
