import Storage from "expo-sqlite/kv-store"

import { NO_ACCOUNT } from "@mizan/core/db/accountChoice"

const LAST_ACCOUNT_KEY = "mizan.lastCashAccount"

/** The account last used on this phone, so a run of payments from one wallet needs no picking. */
export function lastAccount(): string {
  try {
    return Storage.getItemSync(LAST_ACCOUNT_KEY) ?? NO_ACCOUNT
  } catch {
    return NO_ACCOUNT
  }
}

export function rememberAccount(id: string) {
  try {
    Storage.setItemSync(LAST_ACCOUNT_KEY, id)
  } catch {
    // A per-device convenience; losing it costs one extra pick.
  }
}
