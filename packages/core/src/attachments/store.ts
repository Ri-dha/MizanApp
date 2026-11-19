import { api, unwrap } from "../api/client"
import { softDelete, writeFields } from "../db/write"
import type { Attachment } from "../schema"
import { ALL_TABLES, rows, store, table } from "../store/store"
import { decryptWithKey, encryptBytes, fileKey } from "./crypto"

export const BACKUP_OWNER_TYPE = "BACKUP"
/** ADR storage-2: the server deletes receipt photos this long after upload; keep in step with `mizan.storage.receipt-retention`. */
export const RECEIPT_RETENTION_DAYS = 30
const DAY_MS = 86_400_000
/** Storage only ever holds ciphertext, so it is never told what kind of file it is. */
const SEALED_CONTENT_TYPE = "application/octet-stream"

type Kind = "RECEIPT" | "BACKUP"
const kindOf = (attachment: Attachment): Kind => (attachment.ownerType === BACKUP_OWNER_TYPE ? "BACKUP" : "RECEIPT")

/** Files from before ADR e2e-1 have no key of their own; only the web ever wrote them. */
let legacyKey: (() => Promise<CryptoKey>) | null = null

export function installLegacyFileKey(provide: () => Promise<CryptoKey>) {
  legacyKey = provide
}

async function decrypt(cipher: ArrayBuffer, attachment: Attachment): Promise<ArrayBuffer> {
  if (attachment.blobKey) return decryptWithKey(cipher, attachment.iv, await fileKey(attachment.blobKey))
  if (!legacyKey) throw new Error("ATTACHMENT_KEY_MISSING")
  return decryptWithKey(cipher, attachment.iv, await legacyKey())
}

/** Encrypt with a key of its own, keep locally, and queue the row for sync; the bytes upload after it. */
export async function attachBytes(plain: ArrayBuffer, mimeType: string, ownerType: string, ownerRecordId: string): Promise<string> {
  const { iv, cipher, blobKey } = await encryptBytes(plain)
  const id = crypto.randomUUID()
  await store().transaction(ALL_TABLES, async () => {
    await table("blobs").put({ id, bytes: cipher, uploaded: false })
    await writeFields<Attachment>("attachment", id, {
      visibility: "SHARED", ownerType, ownerRecordId, mimeType, byteSize: cipher.byteLength, iv, blobKey, uploadedAt: null,
    })
  })
  return id
}

export async function removeAttachment(id: string) {
  await store().transaction(ALL_TABLES, async () => {
    await table("blobs").delete(id)
    await softDelete("attachment", id)
  })
}

/** Counted from the upload, as the server counts it; a photo not uploaded yet has not started its month. */
export function photoExpired(attachment: Pick<Attachment, "ownerType" | "uploadedAt">, now = Date.now()): boolean {
  if (attachment.ownerType === BACKUP_OWNER_TYPE || !attachment.uploadedAt) return false
  return now - Date.parse(attachment.uploadedAt) >= RECEIPT_RETENTION_DAYS * DAY_MS
}

/** The row stays so the transaction keeps its link; only this device's copy of the bytes goes. */
export async function dropExpiredPhotos(now = Date.now()): Promise<number> {
  const expired = (await rows("attachments", (a) => a.deletedAt === null && photoExpired(a, now))).map((a) => a.id)
  const held = (await table("blobs").bulkGet(expired)).filter((blob) => blob !== undefined).map((blob) => blob.id)
  await table("blobs").bulkDelete(held)
  return held.length
}

/** The ciphertext, from this device or fetched from storage (and kept); null when gone or expired. */
export async function attachmentCipher(attachment: Attachment): Promise<ArrayBuffer | null> {
  const held = await table("blobs").get(attachment.id)
  if (held) return held.bytes
  const { url } = await unwrap(api().GET("/api/v1/attachments/{id}/download-url", { params: { path: { id: attachment.id }, query: { kind: kindOf(attachment) } } }))
  const response = await fetch(url)
  if (!response.ok) return null
  const bytes = await response.arrayBuffer()
  await table("blobs").put({ id: attachment.id, bytes, uploaded: true })
  return bytes
}

/** The decrypted bytes and their type, for display or on-device processing. */
export async function attachmentBytes(id: string): Promise<{ bytes: ArrayBuffer; mimeType: string } | null> {
  const attachment = await table("attachments").get(id)
  if (!attachment || attachment.deletedAt !== null || photoExpired(attachment)) return null
  const cipher = await attachmentCipher(attachment)
  if (!cipher) return null
  return { bytes: await decrypt(cipher, attachment), mimeType: attachment.mimeType }
}

/** Runs after a push, so the row the URL is signed against already exists on the server. */
export async function uploadPendingBlobs(): Promise<void> {
  const pending = (await table("blobs").all()).filter((b) => !b.uploaded)
  for (const blob of pending) {
    const stillQueued = (await table("outbox").where("rowId", blob.id)).length
    if (stillQueued > 0) continue
    const attachment = await table("attachments").get(blob.id)
    if (!attachment || attachment.deletedAt !== null) continue
    const { url } = await unwrap(api().POST("/api/v1/attachments/{id}/upload-url", { params: { path: { id: blob.id }, query: { kind: kindOf(attachment) } } }))
    const response = await fetch(url, { method: "PUT", body: blob.bytes, headers: { "Content-Type": SEALED_CONTENT_TYPE } })
    if (!response.ok) continue
    await table("blobs").put({ ...blob, uploaded: true })
    await writeFields<Attachment>("attachment", blob.id, { uploadedAt: new Date().toISOString() })
  }
}
