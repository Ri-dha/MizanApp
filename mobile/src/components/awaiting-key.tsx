import { useTranslation } from "react-i18next"

import { useSyncStatus } from "@/hooks/use-core"
import { Notice } from "./notice"

/** Without it a new member sees an empty household and no reason why (ADR e2e-1: only a member's device can share the key). */
export function AwaitingKey() {
  const { t } = useTranslation()
  return useSyncStatus().awaitingKey ? <Notice testID="awaiting-key">{t("sync.awaitingKey")}</Notice> : null
}
