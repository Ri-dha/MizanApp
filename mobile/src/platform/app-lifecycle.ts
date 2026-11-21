import NetInfo from "@react-native-community/netinfo"
import { AppState } from "react-native"

import type { Lifecycle } from "@mizan/core/platform/lifecycle"

let online = true
NetInfo.addEventListener((state) => {
  online = state.isConnected !== false
})

export const appLifecycle: Lifecycle = {
  isOnline: () => online,
  onOnline: (listener) => NetInfo.addEventListener((state) => {
    if (state.isConnected) listener()
  }),
  onOffline: (listener) => NetInfo.addEventListener((state) => {
    if (state.isConnected === false) listener()
  }),
  onForeground: (listener) => AppState.addEventListener("change", (state) => {
    if (state === "active") listener()
  }),
  isForeground: () => AppState.currentState === "active",
}
