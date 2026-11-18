import { useLiveQuery } from "dexie-react-hooks"
import { NOTIFICATION_DEFAULTS, liveNotificationSetting, type NotificationValues } from "@mizan/core/db/notifications"

export * from "@mizan/core/db/notifications"

export function useNotificationSettings(): NotificationValues {
  const setting = useLiveQuery(liveNotificationSetting, [], undefined)
  if (!setting) return NOTIFICATION_DEFAULTS
  const { billDue, billLeadDays, payDay, overspend, overspendThresholdBp, monthClose, metalPrice, metalMoveBp, quietMode } = setting
  return { billDue, billLeadDays, payDay, overspend, overspendThresholdBp, monthClose, metalPrice, metalMoveBp, quietMode }
}
