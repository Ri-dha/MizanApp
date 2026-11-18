import { gunzipSync, gzipSync } from "fflate"
import { decryptBackup as decryptWith, deriveBackupKey, encryptBackup as encryptWith, SALT_BYTES, type Compression } from "@mizan/core/backup/format"
import { useLiveQuery } from "dexie-react-hooks"

import { api, unwrap } from "@/api/client"
import type { LocalSession } from "@/api/auth"
import { buildExport, validateImport, type ImportPreview } from "@/data/export"
import { META_KEYS, readMeta, writeMeta, deleteMeta } from "@mizan/core/db/meta"
import { db, type Attachment } from "@/db/schema"
import { softDelete, writeFields } from "@mizan/core/db/write"

import { BACKUP_OWNER_TYPE } from "@/attachments/store"
export { BACKUP_OWNER_TYPE }
const IV_BYTES = 12
const ITERATIONS = 310_000
const KEEP_LAST = 7
const DAY_MS = 24 * 60 * 60 * 1000
const MIME = "application/octet-stream"

interface StoredBackupKey {
  salt: number[]
  iterations: number
  key: JsonWebKey
}

export interface BackupState {
  configured: boolean
  automatic: boolean
  lastBackupAt: number | null
}

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

export async function setBackupPassphrase(passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const key = await deriveBackupKey(passphrase, salt, ITERATIONS)
  const stored: StoredBackupKey = { salt: [...salt], iterations: ITERATIONS, key: await crypto.subtle.exportKey("jwk", key) }
  await writeMeta(META_KEYS.backupKey, stored)
}

export async function clearBackupPassphrase() {
  await deleteMeta(META_KEYS.backupKey)
  await writeMeta(META_KEYS.backupAuto, false)
}

export async function setAutomaticBackup(on: boolean) {
  await writeMeta(META_KEYS.backupAuto, on)
}

export async function backupState(): Promise<BackupState> {
  const [key, auto, last] = await Promise.all([readMeta<StoredBackupKey>(META_KEYS.backupKey), readMeta<boolean>(META_KEYS.backupAuto), readMeta<number>(META_KEYS.backupLastAt)])
  return { configured: !!key, automatic: auto ?? false, lastBackupAt: last ?? null }
}

const fflate: Compression = { gzip: (bytes) => gzipSync(bytes), gunzip: (bytes) => gunzipSync(bytes) }

export const encryptBackup = (json: string, key: CryptoKey, salt: Uint8Array, iterations: number, iv: Uint8Array) => encryptWith(json, key, salt, iterations, iv, fflate)
export const decryptBackup = (bytes: Uint8Array, passphrase: string, iv: Uint8Array) => decryptWith(bytes, passphrase, iv, fflate)

export function useBackupState(): BackupState {
  return useLiveQuery(backupState, [], { configured: false, automatic: false, lastBackupAt: null })
}

/** Builds, encrypts and queues one backup; the sync engine uploads the bytes after the row. */
export async function createBackup(session: LocalSession): Promise<string> {
  const stored = await readMeta<StoredBackupKey>(META_KEYS.backupKey)
  if (!stored) throw new Error("BACKUP_NOT_CONFIGURED")
  const key = await crypto.subtle.importKey("jwk", stored.key, { name: "AES-GCM" }, true, ["encrypt", "decrypt"])
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const bytes = await encryptBackup(JSON.stringify(await buildExport(session)), key, new Uint8Array(stored.salt), stored.iterations, iv)
  const id = crypto.randomUUID()
  await db.transaction("rw", db.tables, async () => {
    await db.blobs.put({ id, bytes: bytes.buffer as ArrayBuffer, uploaded: false })
    await writeFields<Attachment>("attachment", id, {
      visibility: "PRIVATE", ownerType: BACKUP_OWNER_TYPE, ownerRecordId: session.userId, mimeType: MIME, byteSize: bytes.byteLength, iv: toBase64(iv), uploadedAt: null,
    })
    const older = (await listBackups()).filter((b) => b.id !== id).slice(KEEP_LAST - 1)
    for (const old of older) {
      await softDelete("attachment", old.id)
      await db.blobs.delete(old.id)
    }
  })
  await writeMeta(META_KEYS.backupLastAt, Date.now())
  return id
}

export async function listBackups(): Promise<Attachment[]> {
  const rows = await db.attachments.filter((a) => a.ownerType === BACKUP_OWNER_TYPE && a.deletedAt === null).toArray()
  return rows.sort((a, b) => ((a.uploadedAt ?? "9") < (b.uploadedAt ?? "9") ? 1 : -1))
}

export function useBackups(): Attachment[] {
  return useLiveQuery(listBackups, [], [])
}

let running = false

/** Called after a successful sync: at most one automatic backup a day, and only when configured. */
export async function runBackupIfDue(session: LocalSession | null) {
  if (!session || running) return
  const state = await backupState()
  if (!state.configured || !state.automatic) return
  if (state.lastBackupAt !== null && Date.now() - state.lastBackupAt < DAY_MS) return
  running = true
  try {
    await createBackup(session)
  } finally {
    running = false
  }
}

/** Fetches (or reads locally), decrypts and validates; the caller shows the preview and then applies it. */
export async function openBackup(attachment: Attachment, passphrase: string): Promise<ImportPreview> {
  let blob = await db.blobs.get(attachment.id)
  if (!blob) {
    const { url } = await unwrap(api.GET("/api/v1/attachments/{id}/download-url", { params: { path: { id: attachment.id }, query: { kind: "BACKUP" } } }))
    const response = await fetch(url)
    if (!response.ok) throw new Error("BACKUP_DOWNLOAD_FAILED")
    blob = { id: attachment.id, bytes: await response.arrayBuffer(), uploaded: true }
    await db.blobs.put(blob)
  }
  const json = await decryptBackup(new Uint8Array(blob.bytes), passphrase, fromBase64(attachment.iv))
  return validateImport(JSON.parse(json))
}
