export * from "@mizan/core/auth/household"

const PENDING_KEY = "mizan.pendingInvite"

export function rememberPendingInvite(token: string) {
  try { localStorage.setItem(PENDING_KEY, token) } catch { /* private mode */ }
}

export function takePendingInvite(): string | null {
  try {
    const token = localStorage.getItem(PENDING_KEY)
    if (token) localStorage.removeItem(PENDING_KEY)
    return token
  } catch {
    return null
  }
}
