import Constants from "expo-constants"
import * as Notifications from "expo-notifications"
import { router, type Href } from "expo-router"
import { Platform } from "react-native"
import Storage from "expo-sqlite/kv-store"

import { api, unwrap } from "@mizan/core/api/client"

/** "needs-setup" until the app is linked to an EAS project, which issues the push tokens (ADR push-1). */
export type PhonePushState = "on" | "off" | "denied" | "needs-setup" | "unsupported"

const TOKEN_KEY = "mizan.pushToken"
const ANDROID_CHANNEL = "reminders"

/** The web paths the server's reminders open, and the phone screens they mean. */
const SCREENS: Record<string, Href> = { "/bills": "/bills", "/income": "/income", "/plan": "/plan", "/networth": "/networth", "/metals": "/metals", "/settings": "/settings", "/support": "/support" }
/** A support reply opens its report (ADR support-1). */
const REPORT_PATH = /^\/support\/([0-9a-f-]{36})$/

function screenFor(url: string): Href | undefined {
  const report = REPORT_PATH.exec(url)
  return report ? { pathname: "/support-report", params: { id: report[1] } } : SCREENS[url]
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
})

const projectId = (): string | undefined => Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId

export async function phonePushState(): Promise<PhonePushState> {
  if (Platform.OS === "web") return "unsupported"
  if (!projectId()) return "needs-setup"
  const permission = await Notifications.getPermissionsAsync()
  if (permission.status === "denied" && !permission.canAskAgain) return "denied"
  return Storage.getItemSync(TOKEN_KEY) ? "on" : "off"
}

export async function enablePhonePush(): Promise<PhonePushState> {
  const id = projectId()
  if (!id) return "needs-setup"
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, { name: "Reminders", importance: Notifications.AndroidImportance.DEFAULT })
  }
  const permission = await Notifications.requestPermissionsAsync()
  if (!permission.granted) return "denied"
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id })
  await unwrap(api().POST("/api/v1/notifications/phones", { body: { token } }))
  Storage.setItemSync(TOKEN_KEY, token)
  return "on"
}

export async function disablePhonePush(): Promise<PhonePushState> {
  const token = Storage.getItemSync(TOKEN_KEY)
  if (token) await unwrap(api().DELETE("/api/v1/notifications/phones", { body: { token } }))
  Storage.removeItemSync(TOKEN_KEY)
  return "off"
}

export async function sendTestPush(): Promise<number> {
  return (await unwrap(api().POST("/api/v1/notifications/test"))).sent ?? 0
}

/** A tapped reminder or reply opens the screen it is about, once the app is unlocked. */
export function openRemindersOnTap(): () => void {
  const open = (response: Notifications.NotificationResponse | null) => {
    const url = response?.notification.request.content.data?.url
    const screen = typeof url === "string" ? screenFor(url) : undefined
    if (screen) router.navigate(screen)
  }
  void Notifications.getLastNotificationResponseAsync().then(open)
  const subscription = Notifications.addNotificationResponseReceivedListener(open)
  return () => subscription.remove()
}
