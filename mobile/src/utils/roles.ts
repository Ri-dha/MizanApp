import type { LocalSession } from "@mizan/core/session"

/** §4.2: a dependent gets their own ledger and goals; an advisor gets the annual report and nothing else. */
export type Audience = "FULL" | "DEPENDENT" | "ADVISOR"

export function audienceOf(session: LocalSession | null | undefined): Audience {
  if (session?.role === "ADVISOR") return "ADVISOR"
  if (session?.role === "DEPENDENT") return "DEPENDENT"
  return "FULL"
}
