import { useLiveQuery } from "dexie-react-hooks"
import { useTranslation } from "react-i18next"

import { dismissConflict, liveConflicts } from "@mizan/core/db/conflicts"
import { dismissSyncRejection, liveSyncRejections } from "@mizan/core/db/syncRejections"
import { formatWhen } from "@/app/dates"
import { syncNow, useSyncStatus } from "@/sync/engine"

export function useSyncPage() {
  const { t, i18n } = useTranslation()
  const status = useSyncStatus()
  const conflicts = useLiveQuery(liveConflicts, [], [])
  const rejections = useLiveQuery(liveSyncRejections, [], [])
  const lastSync = status.lastSyncAt ? t("sync.lastSync", { when: formatWhen(status.lastSyncAt, i18n.language) }) : t("sync.never")
  return {
    headline: status.pending > 0 ? t("sync.status.pending", { count: status.pending }) : t(`sync.status.${status.phase}`),
    detail: `${lastSync}${status.lastError ? ` · ${status.lastError}` : ""}`,
    state: status.phase === "error" ? "error" as const : status.pending > 0 || status.phase !== "idle" ? "busy" as const : "ok" as const,
    syncing: status.phase === "syncing",
    syncNow: () => void syncNow(),
    conflicts,
    rejections,
    when: (iso: string) => formatWhen(iso, i18n.language),
    dismissConflict: (id: Parameters<typeof dismissConflict>[0]) => void dismissConflict(id),
    dismissRejection: (opId: Parameters<typeof dismissSyncRejection>[0]) => void dismissSyncRejection(opId),
  }
}

export type SyncPageModel = ReturnType<typeof useSyncPage>
