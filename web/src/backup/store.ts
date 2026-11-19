import { gunzipSync, gzipSync } from "fflate"
import { useLiveQuery } from "dexie-react-hooks"

import { backupState, installCompression, listBackups, NO_BACKUP, type BackupState } from "@mizan/core/backup/store"
import { decryptBackup as decryptWith, encryptBackup as encryptWith, type Compression } from "@mizan/core/backup/format"
import type { Attachment } from "@/db/schema"

export { BACKUP_OWNER_TYPE } from "@mizan/core/attachments/store"
export * from "@mizan/core/backup/store"

const fflate: Compression = { gzip: (bytes) => gzipSync(bytes), gunzip: (bytes) => gunzipSync(bytes) }
installCompression(fflate)

export const encryptBackup = (json: string, key: CryptoKey, salt: Uint8Array, iterations: number, iv: Uint8Array) => encryptWith(json, key, salt, iterations, iv, fflate)
export const decryptBackup = (bytes: Uint8Array, passphrase: string, iv: Uint8Array) => decryptWith(bytes, passphrase, iv, fflate)

export function useBackupState(): BackupState {
  return useLiveQuery(backupState, [], NO_BACKUP)
}

export function useBackups(): Attachment[] {
  return useLiveQuery(listBackups, [], [])
}
