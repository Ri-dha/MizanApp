import { useSyncExternalStore } from "react"

import { appHidden, appShown, installBiometrics, lockState, subscribeLock, type LockState } from "@mizan/core/lock/store"
import { enrollWebAuthn, hasWebAuthnUnlock, removeWebAuthn, unlockWithWebAuthn, webAuthnAvailable } from "./webauthn"

export * from "@mizan/core/lock/store"

export function useLockState(): LockState {
  return useSyncExternalStore(subscribeLock, lockState)
}

/** WebAuthn enrolment also needs the account's id and name, so the web passes those at enrol time itself. */
installBiometrics({
  available: webAuthnAvailable,
  enrolled: hasWebAuthnUnlock,
  enrol: async () => false,
  unlock: unlockWithWebAuthn,
  remove: removeWebAuthn,
})

export { enrollWebAuthn }

/** FR-ACC-03: the page blurs while hidden and re-locks after the grace period. */
export function startLockWatcher() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      appHidden()
      document.body.classList.add("privacy-blur")
      return
    }
    document.body.classList.remove("privacy-blur")
    void appShown()
  })
}
