import { useSyncExternalStore } from "react"

import { currentSession, installAuth, sessionLost, subscribeSession, type LocalSession } from "@mizan/core/auth/session"
import { META_KEYS } from "@mizan/core/db/meta"
import { resetLock } from "@/lock/store"
import { refreshAccessToken, setAccessToken, setSessionLostHandler } from "./client"

export * from "@mizan/core/auth/session"

/** The web's refresh token stays in the httpOnly cookie, so only the access token is kept here. */
installAuth({
  acceptTokens: async ({ accessToken }) => setAccessToken(accessToken),
  forgetTokens: async () => setAccessToken(null),
  refreshTokens: refreshAccessToken,
  resetLock,
  lockMetaKeys: () => [META_KEYS.pin, META_KEYS.webauthn, META_KEYS.lockAfterSeconds],
})
setSessionLostHandler(sessionLost)

export function useSession(): LocalSession | null | undefined {
  return useSyncExternalStore(subscribeSession, currentSession)
}
