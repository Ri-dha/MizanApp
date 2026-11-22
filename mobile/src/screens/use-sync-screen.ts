import { useTranslation } from "react-i18next"

import { dismissConflict, liveConflicts } from "@mizan/core/db/conflicts"
import { dismissSyncRejection, liveSyncRejections, type SyncRejection } from "@mizan/core/db/syncRejections"
import type { LocalConflict } from "@mizan/core/schema"
import { syncNow } from "@mizan/core/sync/engine"
import { useLiveQuery, useSyncStatus } from "@/hooks/use-core"
import { formatWhen } from "@/utils/dates"

const NONE: LocalConflict[] = []
const NO_REJECTIONS: SyncRejection[] = []
const show = (value: unknown) => (value === null || value === undefined ? "—" : typeof value === "string" ? value : JSON.stringify(value))

/** Everything the Sync screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useSyncScreen() {
  const { t, i18n } = useTranslation()
  const status = useSyncStatus()
  const conflicts = useLiveQuery(liveConflicts, [], NONE)
  const rejections = useLiveQuery(liveSyncRejections, [], NO_REJECTIONS)
  const when = (iso: string) => formatWhen(iso, i18n.language)
  const lastSync = status.lastSyncAt ? t("sync.lastSync", { when: formatWhen(status.lastSyncAt, i18n.language) }) : t("sync.never")
  return {
    phase: status.pending > 0 ? ("pending" as const) : status.phase,
    headline: status.pending > 0 ? t("sync.status.pending", { count: status.pending }) : t(`sync.status.${status.phase}`),
    detail: status.lastError ? `${lastSync} · ${status.lastError}` : lastSync,
    syncing: status.phase === "syncing",
    syncNow: () => void syncNow(),
    rejections: rejections.map((rejection) => ({
      id: rejection.opId,
      title: `${t(`sync.tables.${rejection.table}`)} · ${when(rejection.rejectedAt)}`,
      reason: t("sync.rejectedReason", { code: rejection.code }),
      dismiss: () => void dismissSyncRejection(rejection.opId),
    })),
    conflicts: conflicts.map((conflict) => ({
      id: conflict.id,
      title: `${conflict.table} · ${conflict.field}`,
      yours: `${t("sync.yours")}: ${show(conflict.clientValue)}`,
      kept: `${t("sync.kept")}: ${show(conflict.serverValue)}`,
      dismiss: () => void dismissConflict(conflict.id),
    })),
  }
}

export type SyncScreenModel = ReturnType<typeof useSyncScreen>
