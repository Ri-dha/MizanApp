/** When the device can reach the network and when the person comes back to the app. */
export interface Lifecycle {
  isOnline(): boolean
  onOnline(listener: () => void): void
  onOffline(listener: () => void): void
  /** The app is on screen again (a browser tab shown, a phone app back from the background). */
  onForeground(listener: () => void): void
}
