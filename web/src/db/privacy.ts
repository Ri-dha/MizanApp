import { useLiveQuery } from "dexie-react-hooks"
import { defaultsOf, livePrivacySetting, type PrivacyKind } from "@mizan/core/db/privacy"
import type { Visibility } from "@mizan/core/schema"

export * from "@mizan/core/db/privacy"

export function usePrivacyDefaults(): Record<PrivacyKind, Visibility> {
  const setting = useLiveQuery(livePrivacySetting, [], undefined)
  return defaultsOf(setting)
}
