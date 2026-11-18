import { api, ApiError, unwrap } from "../api/client"
import { META_KEYS, readMeta, writeMeta } from "../db/meta"
import { purgeExpiredDeletions } from "../db/transactions"
import { onLocalWrite } from "../db/write"
import type { Lifecycle } from "../platform/lifecycle"
import { mayHoldHouseholdKey } from "../roles"
import { SYNC_TABLES, type Syncable, type SyncTableName } from "../schema"
import type { LocalSession } from "../session"
import { rows, sorted, store, table, type Table, type TableName } from "../store/store"
import { KeysReplacedError, refreshGrants, rotateKeysIfDue, shareKeysWithMembers } from "../vault/keyring"
import { openFields, openValue, sealFields } from "../vault/records"
import { completeMigrationIfDrained, runDeviceDuties } from "./duties"
import { newNodeId, observe, type HlcState } from "./hlc"
import { mergeFields } from "./merge"

export type SyncPhase = "idle" | "offline" | "syncing" | "error"

export interface SyncStatus {
  phase: SyncPhase
  pending: number
  lastSyncAt: number | null
  lastError: string | null
}

/** What each app supplies around the sync loop: its session, its vault, and its own extra steps. */
export interface SyncHost {
  lifecycle: Lifecycle
  loadSession(): Promise<LocalSession | null>
  refreshProfile(): Promise<void>
  vaultReady(): boolean
  onVaultReady(listener: () => void): void
  /** ADR e2e-3: the account started over elsewhere; this device's rows and keys must go. */
  onKeysReplaced(): Promise<void>
  deviceName(): string
  /** After the device duties, before the second push: receipt photos up and expired ones out. */
  afterDuties(session: LocalSession): Promise<void>
  /** Last: prices and the automatic backup. */
  afterSync(session: LocalSession): Promise<void>
}

const SYNCED_TABLES = Object.values(SYNC_TABLES) as TableName[]
const LOCAL_WRITE_DELAY_MS = 800

function localTableFor(name: SyncTableName): Table<Syncable> {
  return table(SYNC_TABLES[name]) as unknown as Table<Syncable>
}

const PUSH_BATCH = 200
const PULL_LIMIT = 500
const PERIODIC_MS = 5 * 60 * 1000

let status: SyncStatus = { phase: "idle", pending: 0, lastSyncAt: null, lastError: null }
const listeners = new Set<() => void>()
let running: Promise<void> | null = null
let current: SyncHost | null = null

function host(): SyncHost {
  if (!current) throw new Error("SYNC_NOT_STARTED")
  return current
}

function update(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch }
  listeners.forEach((listener) => listener())
}

export function syncStatus(): SyncStatus {
  return status
}

/** Each app turns this into its own reactive hook; returns the unsubscribe. */
export function subscribeSyncStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function refreshPending() {
  update({ pending: await table("outbox").count() })
}

async function deviceId(): Promise<string> {
  const known = await readMeta<string>(META_KEYS.deviceId)
  if (known) return known
  const device = await unwrap(api().POST("/api/v1/sync/devices", { body: { name: host().deviceName() } }))
  await writeMeta(META_KEYS.deviceId, device.id)
  return device.id
}


const APPEND_ONLY: ReadonlySet<string> = new Set(["net_worth_snapshot"])

type QueuedOp = { opId: string; table: SyncTableName; rowId: string; fields: Record<string, unknown>; clocks: Record<string, string> }

/** Seals what can be sealed now; ops for a key not yet granted stay queued for a later sync. */
async function sendableOps(): Promise<QueuedOp[]> {
  const ready: QueuedOp[] = []
  for (const op of await sorted(rows("outbox"), "createdAt")) {
    const row = (await localTableFor(op.table).get(op.rowId)) as (Syncable & { visibility?: string }) | undefined
    if (APPEND_ONLY.has(op.table) && row?.vaulted) {
      await table("outbox").delete(op.opId)
      continue
    }
    const visibility = (op.fields.visibility as string | undefined) ?? row?.visibility
    const sealed = await sealFields(op.table, op.rowId, visibility, op.fields)
    if (!sealed) continue
    ready.push({ opId: op.opId, table: op.table, rowId: op.rowId, fields: sealed, clocks: op.clocks })
    if (ready.length === PUSH_BATCH) break
  }
  return ready
}

/** ADR e2e-4: a refused push means a key was rotated elsewhere; the outbox is sealed again with the new one. */
const KEY_ROTATED = "KEY_ROTATED"

async function push(device: string) {
  let resealed = false
  for (;;) {
    const ops = await sendableOps()
    if (ops.length === 0) return
    let result
    try {
      result = await unwrap(api().POST("/api/v1/sync/push", { body: { deviceId: device, ops } }))
    } catch (error) {
      if (resealed || !(error instanceof ApiError) || error.code !== KEY_ROTATED) throw error
      await refreshGrants()
      resealed = true
      continue
    }
    const appliedIds = result.applied
    const conflicts = await Promise.all(result.conflicts.map(async (conflict) => ({
      id: conflict.id,
      table: conflict.table as SyncTableName,
      rowId: conflict.rowId,
      field: conflict.field,
      clientValue: await openValue(conflict.table, conflict.rowId, conflict.field, conflict.clientValue),
      serverValue: await openValue(conflict.table, conflict.rowId, conflict.field, conflict.serverValue),
      detectedAt: conflict.detectedAt,
      dismissed: false,
    })))
    const applied = new Set(appliedIds)
    await store().transaction(["outbox", "conflicts", ...SYNCED_TABLES], async () => {
      await table("outbox").bulkDelete(appliedIds)
      for (const conflict of conflicts) await table("conflicts").put(conflict)
      for (const op of ops) {
        if (applied.has(op.opId) && APPEND_ONLY.has(op.table)) await localTableFor(op.table).update(op.rowId, { vaulted: true })
      }
    })
    await refreshPending()
    if (ops.length < PUSH_BATCH) return
  }
}

async function pull(device: string) {
  for (;;) {
    const since = (await readMeta<number>(META_KEYS.pullCursor)) ?? 0
    const page = await unwrap(api().GET("/api/v1/sync/pull", { params: { query: { deviceId: device, since, limit: PULL_LIMIT } } }))
    await receive(page.records as PulledRecord[])
    await writeMeta(META_KEYS.pullCursor, page.nextSeq)
    if (!page.hasMore) return
  }
}

type PulledRecord = { table: string; rowId: string; ownerId: string; fields: Record<string, unknown>; clocks: Record<string, string>; encrypted: boolean }
type OpenRecord = Omit<PulledRecord, "encrypted"> & { vaulted: boolean }

const inboxKey = (record: { table: string; rowId: string }) => `${record.table}|${record.rowId}`

/** Legacy rows (before ADR e2e-1) arrive plain until their owner's device has re-sent them sealed. */
async function receive(records: PulledRecord[]) {
  const opened: OpenRecord[] = []
  const waiting: PulledRecord[] = []
  for (const record of records) {
    if (!(record.table in SYNC_TABLES)) continue
    if (!record.encrypted) {
      opened.push({ ...record, vaulted: false })
      continue
    }
    const result = await openFields(record.table, record.rowId, record.fields)
    if (result.status === "waiting") waiting.push(record)
    else opened.push({ ...record, fields: result.fields, vaulted: true })
  }
  if (waiting.length > 0) {
    await table("sealedInbox").bulkPut(waiting.map(({ table, rowId, ownerId, fields, clocks }) => ({ key: inboxKey({ table, rowId }), record: { table, rowId, ownerId, fields, clocks } })))
  }
  await applyRecords(opened)
}

async function retrySealed() {
  const parked = await rows("sealedInbox")
  if (parked.length === 0) return
  const opened: OpenRecord[] = []
  const done: string[] = []
  for (const { key, record } of parked) {
    const result = await openFields(record.table, record.rowId, record.fields)
    if (result.status === "waiting") continue
    opened.push({ ...record, fields: result.fields, vaulted: true })
    done.push(key)
  }
  await applyRecords(opened)
  await table("sealedInbox").bulkDelete(done)
}

/**
 * Applies pulled rows with the same per-field rule the server uses, so an edit made here
 * while offline survives a pull that carries an older value for that field.
 */
async function applyRecords(records: OpenRecord[]) {
  if (records.length === 0) return
  await store().transaction([...SYNCED_TABLES, "meta", "sealedInbox"], async () => {
    let clock = (await readMeta<HlcState>(META_KEYS.hlc)) ?? { wall: 0, counter: 0, node: newNodeId() }
    for (const record of records) {
      const local = localTableFor(record.table as SyncTableName)
      const existing = await local.get(record.rowId)
      const storedFields: Record<string, unknown> = existing ? { ...existing } : {}
      const outcome = mergeFields(storedFields, existing?.clocks ?? {}, record.fields, record.clocks)
      await local.put({
        ...(existing ?? { id: record.rowId, deletedAt: null }),
        ...outcome.accepted,
        ownerId: record.ownerId,
        clocks: outcome.clocks,
        ...(record.vaulted || existing?.vaulted ? { vaulted: true } : {}),
      })
      if (record.vaulted) await table("sealedInbox").delete(inboxKey(record))
      for (const stamp of Object.values(record.clocks)) clock = observe(clock, stamp)
    }
    await writeMeta(META_KEYS.hlc, clock)
  })
}

async function exchangeKeys(session: LocalSession) {
  try {
    await refreshGrants()
  } catch (error) {
    // The rows here were removed on the server with the old keys; this device signs in again.
    if (error instanceof KeysReplacedError) await host().onKeysReplaced()
    throw error
  }
  if (!mayHoldHouseholdKey(session.role)) return
  await rotateKeysIfDue()
  await shareKeysWithMembers(session.role === "OWNER")
}

export async function syncNow(): Promise<void> {
  if (running) return running
  running = (async () => {
    if (!host().lifecycle.isOnline()) {
      update({ phase: "offline" })
      return
    }
    // Keys open a moment after sign-in; onVaultReady starts this again then, so it is not a failure.
    if (!host().vaultReady()) return
    update({ phase: "syncing", lastError: null })
    try {
      if (!(await host().loadSession())) return
      await host().refreshProfile()
      const session = await host().loadSession()
      if (!session) return
      const device = await deviceId()
      await exchangeKeys(session)
      await retrySealed()
      await push(device)
      await pull(device)
      await runDeviceDuties(session)
      await host().afterDuties(session)
      await push(device)
      await completeMigrationIfDrained(session)
      await purgeExpiredDeletions()
      await host().afterSync(session)
      const now = Date.now()
      await writeMeta(META_KEYS.lastSyncAt, now)
      update({ phase: "idle", lastSyncAt: now })
    } catch (error) {
      const message = error instanceof ApiError ? error.code : String(error)
      update({ phase: error instanceof ApiError && error.status === 0 ? "offline" : "error", lastError: message })
    } finally {
      await refreshPending()
    }
  })().finally(() => {
    running = null
  })
  return running
}

/** Wires the triggers once: back online, back on screen, a local write, and a slow periodic tick. */
export function startSyncEngine(next: SyncHost) {
  if (current) return
  current = next
  update({ phase: next.lifecycle.isOnline() ? "idle" : "offline" })
  void readMeta<number>(META_KEYS.lastSyncAt).then((at) => update({ lastSyncAt: at ?? null }))
  void refreshPending()

  next.onVaultReady(() => void syncNow())
  next.lifecycle.onOnline(() => void syncNow())
  next.lifecycle.onOffline(() => update({ phase: "offline" }))
  next.lifecycle.onForeground(() => void syncNow())
  setInterval(() => void syncNow(), PERIODIC_MS)
  onLocalWrite(() => {
    void refreshPending()
    scheduleSoon()
  })
  void syncNow()
}

let debounce: ReturnType<typeof setTimeout> | undefined
function scheduleSoon() {
  clearTimeout(debounce)
  debounce = setTimeout(() => void syncNow(), LOCAL_WRITE_DELAY_MS)
}

export async function resetSyncState() {
  await table("meta").bulkDelete([META_KEYS.deviceId, META_KEYS.pullCursor, META_KEYS.lastSyncAt])
  await table("sealedInbox").clear()
  update({ phase: current?.lifecycle.isOnline() === false ? "offline" : "idle", pending: 0, lastSyncAt: null, lastError: null })
}
