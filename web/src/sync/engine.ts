import { useSyncExternalStore } from "react"

import { mayReadQuotes } from "@mizan/core/roles"
import { startSyncEngine as startCoreEngine, subscribeSyncStatus, syncStatus, type SyncStatus } from "@mizan/core/sync/engine"
import { dropExpiredPhotos, uploadPendingBlobs } from "@/attachments/store"
import { runBackupIfDue } from "@/backup/store"
import { clearLocalData, loadSession, refreshProfile, rememberFromServer } from "@/api/auth"
import { refreshQuotes } from "@/market/store"
import { refreshWorldRates } from "@/market/world"
import { claimPendingRebase, finishPendingRebase } from "@mizan/core/db/rebase"
import { syncNow } from "@mizan/core/sync/engine"
import { browserLifecycle } from "@/platform/browserLifecycle"
import { onVaultReady, vaultReady } from "@/vault/account"

export { resetSyncState, syncNow, type SyncPhase, type SyncStatus } from "@mizan/core/sync/engine"

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSyncStatus, syncStatus)
}

function describeDevice(): string {
  const ua = navigator.userAgent
  const platform = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Web"
  return `${platform} browser`
}

export function startSyncEngine() {
  startCoreEngine({
    lifecycle: browserLifecycle,
    loadSession,
    refreshProfile,
    vaultReady,
    onVaultReady,
    async onKeysReplaced() {
      await clearLocalData()
      await rememberFromServer(null)
    },
    deviceName: describeDevice,
    async afterDuties() {
      await uploadPendingBlobs()
      await dropExpiredPhotos()
    },
    async afterSync(session) {
      if (mayReadQuotes(session.role)) await refreshQuotes()
      await refreshWorldRates().catch(() => undefined)
      if ((await finishPendingRebase()) || (await claimPendingRebase(session))) {
        await rememberFromServer(null)
        void syncNow()
      }
      await runBackupIfDue(session)
    },
  })
}
