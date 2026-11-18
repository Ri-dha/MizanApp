import { rows } from "../store/store"

import { type NotificationSetting } from "../schema"
import { writeFields } from "./write"

export type NotificationSwitch = "billDue" | "payDay" | "overspend" | "monthClose" | "metalPrice"
export const NOTIFICATION_SWITCHES: NotificationSwitch[] = ["billDue", "payDay", "overspend", "monthClose", "metalPrice"]

export type NotificationValues = Omit<NotificationSetting, keyof import("../schema").Syncable | "visibility">

/** FR-NTF-06 defaults; they match the server's, which applies them when no row was ever saved. */
export const NOTIFICATION_DEFAULTS: NotificationValues = {
  billDue: true, billLeadDays: 3, payDay: true, overspend: true, overspendThresholdBp: 9000,
  monthClose: true, metalPrice: false, metalMoveBp: 200, quietMode: false,
}

export const liveNotificationSetting = () => rows("notificationSettings", (n) => n.deletedAt === null).then((found) => found[0])


export async function saveNotificationSettings(patch: Partial<NotificationValues>) {
  const existing = await liveNotificationSetting()
  const id = existing?.id ?? crypto.randomUUID()
  await writeFields<NotificationSetting>("notification_setting", id, { ...(existing ? {} : { ...NOTIFICATION_DEFAULTS, visibility: "PRIVATE" as const }), ...patch })
}
