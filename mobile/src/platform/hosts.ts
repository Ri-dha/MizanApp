import * as Device from "expo-device"

import { clearLocalData, installAuth, loadSession, refreshProfile, rememberFromServer } from "@mizan/core/auth/session"
import { deleteMeta, META_KEYS } from "@mizan/core/db/meta"
import { refreshQuotes } from "@mizan/core/market/prices"
import { startSyncEngine } from "@mizan/core/sync/engine"
import { onVaultReady, vaultReady } from "@mizan/core/vault/account"
import { forgetTokens, keepTokens } from "./api-client"
import { appLifecycle } from "./app-lifecycle"

/** The phone's lock arrives with the lock step of Phase 4; until then a cleared device only drops its PIN entry. */
export function installAuthHost() {
  installAuth({
    acceptTokens: ({ accessToken, refreshToken }) => keepTokens(accessToken, refreshToken),
    forgetTokens,
    resetLock: () => deleteMeta(META_KEYS.pin),
    lockMetaKeys: () => [META_KEYS.pin, META_KEYS.lockAfterSeconds],
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
