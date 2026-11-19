import type { LocalSession } from "../auth/session"
import { BACKUP_OWNER_TYPE, attachmentCipher } from "../attachments/store"
import { buildExport, validateImport, type ImportPreview } from "../data/export"
import { META_KEYS, deleteMeta, readMeta, writeMeta } from "../db/meta"
import { softDelete, writeFields } from "../db/write"
import type { Attachment } from "../schema"
import { ALL_TABLES, rows, store, table } from "../store/store"
import { decryptBackup, deriveBackupKey, encryptBackup, SALT_BYTES, type Compression } from "./format"

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

export const NO_BACKUP: BackupState = { configured: false, automatic: false, lastBackupAt: null }

/** Each app gzips with its own library; core stays free of runtime dependencies (ADR mobile-2). */
let compression: Compression | null = null

export function installCompression(next: Compression) {
  compression = next
}

function compressor(): Compression {
  if (!compression) throw new Error("COMPRESSION_NOT_SET")
  return compression
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

export async function listBackups(): Promise<Attachment[]> {
  const found = await rows("attachments", (a) => a.ownerType === BACKUP_OWNER_TYPE && a.deletedAt === null)
  return found.sort((a, b) => ((a.uploadedAt ?? "9") < (b.uploadedAt ?? "9") ? 1 : -1))
}

/** Builds, encrypts and queues one backup; the sync engine uploads the bytes after the row. */
export async function createBackup(session: LocalSession): Promise<string> {
  const stored = await readMeta<StoredBackupKey>(META_KEYS.backupKey)
  if (!stored) throw new Error("BACKUP_NOT_CONFIGURED")
  const key = await crypto.subtle.importKey("jwk", stored.key, { name: "AES-GCM" }, true, ["encrypt", "decrypt"])
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const bytes = await encryptBackup(JSON.stringify(await buildExport(session)), key, new Uint8Array(stored.salt), stored.iterations, iv, compressor())
  const id = crypto.randomUUID()
  await store().transaction(ALL_TABLES, async () => {
    await table("blobs").put({ id, bytes: bytes.buffer as ArrayBuffer, uploaded: false })
    await writeFields<Attachment>("attachment", id, {
      visibility: "PRIVATE", ownerType: BACKUP_OWNER_TYPE, ownerRecordId: session.userId, mimeType: MIME, byteSize: bytes.byteLength, iv: toBase64(iv), uploadedAt: null,
    })
    const older = (await listBackups()).filter((b) => b.id !== id).slice(KEEP_LAST - 1)
    for (const old of older) {
      await softDelete("attachment", old.id)
      await table("blobs").delete(old.id)
    }
  })
  await writeMeta(META_KEYS.backupLastAt, Date.now())
  return id
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
  const cipher = await attachmentCipher(attachment)
  if (!cipher) throw new Error("BACKUP_DOWNLOAD_FAILED")
  const json = await decryptBackup(new Uint8Array(cipher), passphrase, fromBase64(attachment.iv), compressor())
  return validateImport(JSON.parse(json))
}
