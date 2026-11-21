import type { CashAccount } from "@mizan/core/schema"

/** A Select needs a value for "no account". */
export const NO_ACCOUNT = "none"
const LAST_ACCOUNT_KEY = "mizan.lastCashAccount"

/** The account last used on this device, so a run of payments from one wallet needs no picking. */
export function lastAccount(): string {
  try {
    return localStorage.getItem(LAST_ACCOUNT_KEY) ?? NO_ACCOUNT
  } catch {
    return NO_ACCOUNT
  }
}

export function rememberAccount(id: string) {
  try {
    localStorage.setItem(LAST_ACCOUNT_KEY, id)
  } catch {
    // A per-device convenience; losing it costs one extra pick.
  }
}

/** The picked account's id, or null for "No account" or an account that no longer exists. */
export const pickedAccount = (value: string, accounts: CashAccount[]): string | null => (accounts.some((a) => a.id === value) ? value : null)
