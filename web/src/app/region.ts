import { useSession } from "@/api/auth"
import { IRAQ } from "@mizan/core/market/currency"

/** ADR currency-1: the Baghdad market and Central Bank screens are for people in Iraq. */
export function useIraqi(): boolean {
  return (useSession()?.country ?? IRAQ) === IRAQ
}
