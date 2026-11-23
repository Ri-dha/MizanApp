import { logout } from "@/api/auth"
import { clearLock } from "@/lock/store"
import { resetSyncState } from "@/sync/engine"

/** Leaves nothing of the account behind on this device: the PIN, the sync position, then the session. */
export async function signOut() {
  await clearLock()
  await resetSyncState()
  await logout()
}
