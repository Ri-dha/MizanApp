import { attachBytes, attachmentBytes, installLegacyFileKey } from "@mizan/core/attachments/store"
import { db } from "@/db/schema"
import { ensureDataKey } from "./crypto"
import { downscaleImage } from "./images"

export { BACKUP_OWNER_TYPE, dropExpiredPhotos, photoExpired, RECEIPT_RETENTION_DAYS, removeAttachment, uploadPendingBlobs } from "@mizan/core/attachments/store"

const JPEG = "image/jpeg"

installLegacyFileKey(ensureDataKey)

/** Downscale in the browser, then encrypt and queue in core. */
export async function attachImage(file: File, ownerType: string, ownerRecordId: string): Promise<string> {
  const image = await downscaleImage(file)
  return attachBytes(await image.arrayBuffer(), JPEG, ownerType, ownerRecordId)
}

/** The decrypted bytes of an attachment held on this device, for on-device processing such as OCR. */
export async function attachmentBlob(id: string): Promise<Blob | null> {
  if (!(await db.blobs.get(id))) return null
  const file = await attachmentBytes(id)
  return file ? new Blob([file.bytes], { type: file.mimeType }) : null
}

/** A decrypted object URL for display; fetches from storage when this device has no copy and is online. */
export async function attachmentObjectUrl(id: string): Promise<string | null> {
  if (!navigator.onLine && !(await db.blobs.get(id))) return null
  const file = await attachmentBytes(id)
  return file ? URL.createObjectURL(new Blob([file.bytes], { type: file.mimeType })) : null
}
