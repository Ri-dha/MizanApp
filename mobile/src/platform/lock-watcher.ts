import { AppState } from "react-native"

import { appHidden, appShown } from "@mizan/core/lock/store"

/** FR-ACC-03 on phones: leaving the app starts the grace period; "inactive" is the task switcher, which the cover hides. */
export function startLockWatcher() {
  AppState.addEventListener("change", (next) => {
    if (next === "background") appHidden()
    if (next === "active") void appShown()
  })
}
