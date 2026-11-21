import { gunzipSync, gzipSync } from "fflate"
import * as Device from "expo-device"

import { clearLocalData, installAuth, loadSession, refreshProfile, rememberFromServer } from "@mizan/core/auth/session"
import { META_KEYS } from "@mizan/core/db/meta"
import { resetLock } from "@mizan/core/lock/store"
import { dropExpiredPhotos, uploadPendingBlobs } from "@mizan/core/attachments/store"
import { installCompression, runBackupIfDue } from "@mizan/core/backup/store"
import { claimPendingRebase, finishPendingRebase } from "@mizan/core/db/rebase"
import { refreshQuotes } from "@mizan/core/market/prices"
import { refreshWorldRates } from "@mizan/core/market/world"
import { mayReadQuotes } from "@mizan/core/roles"
import { startSyncEngine, syncNow } from "@mizan/core/sync/engine"
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

/** ADR mobile-3: the phone's host around core's sync loop. */
export function installCompressionHost() {
  installCompression({ gzip: (bytes) => gzipSync(bytes), gunzip: (bytes) => gunzipSync(bytes) })
}

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
    afterDuties: async () => {
      await uploadPendingBlobs()
      await dropExpiredPhotos()
    },
    afterSync: async (session) => {
      if (mayReadQuotes(session.role)) await refreshQuotes()
      await refreshWorldRates().catch(() => undefined)
      await runBackupIfDue(session)
      // ADR currency-1: a base change converts records once per device; then the session and records are fetched again.
      if ((await finishPendingRebase()) || (await claimPendingRebase(session))) {
        await rememberFromServer(null)
        void syncNow()
      }
    },
  })
}
