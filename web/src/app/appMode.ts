import { useSession } from "@/api/auth"
import { usePreferences } from "@/app/preferences"
import type { AppMode } from "@mizan/core/domain/appMode"

/** ADR mode-1. Dependants and advisors already see a cut-down app of their own, so the choice is not theirs to make. */
export function useAppMode(): AppMode {
  const role = useSession()?.role
  const chosen = usePreferences().appMode
  return role === "DEPENDENT" || role === "ADVISOR" ? "advanced" : chosen
}
