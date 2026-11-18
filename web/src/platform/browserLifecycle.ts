import type { Lifecycle } from "@mizan/core/platform/lifecycle"

export const browserLifecycle: Lifecycle = {
  isOnline: () => navigator.onLine,
  onOnline: (listener) => window.addEventListener("online", listener),
  onOffline: (listener) => window.addEventListener("offline", listener),
  onForeground: (listener) =>
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") listener()
    }),
}
