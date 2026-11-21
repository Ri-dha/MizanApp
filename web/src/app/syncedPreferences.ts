import { useLiveQuery } from "dexie-react-hooks"
import { useEffect } from "react"

import { liveSyncedPreferences, reconcileSynced, saveSyncedPreferences } from "@mizan/core/db/homeLayout"
import { applyLocal, DEFAULTS, preferences } from "@/app/preferences"
import { useSyncStatus } from "@/sync/engine"

/** ADR home-2: brings this browser's reading preferences in line with the person's synced row. Mounted once, signed in. */
export function SyncedPreferencesSync() {
  const found = useLiveQuery(liveSyncedPreferences, [])
  const hasSynced = useSyncStatus().lastSyncAt !== null
  useEffect(() => {
    if (!found) return
    const { apply, seed } = reconcileSynced(found, preferences(), DEFAULTS, hasSynced)
    if (Object.keys(apply).length > 0) applyLocal(apply)
    if (Object.keys(seed).length > 0) void saveSyncedPreferences(seed).catch(() => undefined)
  }, [found, hasSynced])
  return null
}
