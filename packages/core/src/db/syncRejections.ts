import type { SyncTableName } from "../schema"
import { META_KEYS, readMeta, writeMeta } from "./meta"

/** ADR sync-3: a change the server refused on its own merits; it never reached the other devices. Never holds values. */
export interface SyncRejection {
  opId: string
  table: SyncTableName
  rowId: string
  code: string
  rejectedAt: string
}

const KEPT = 50

export async function liveSyncRejections(): Promise<SyncRejection[]> {
  const stored = (await readMeta<SyncRejection[]>(META_KEYS.syncRejections)) ?? []
  return [...stored].sort((a, b) => b.rejectedAt.localeCompare(a.rejectedAt))
}

export async function recordSyncRejections(rejections: SyncRejection[]) {
  if (rejections.length === 0) return
  const stored = (await readMeta<SyncRejection[]>(META_KEYS.syncRejections)) ?? []
  await writeMeta(META_KEYS.syncRejections, [...stored, ...rejections].slice(-KEPT))
}

export async function dismissSyncRejection(opId: string) {
  const stored = (await readMeta<SyncRejection[]>(META_KEYS.syncRejections)) ?? []
  await writeMeta(META_KEYS.syncRejections, stored.filter((r) => r.opId !== opId))
}
