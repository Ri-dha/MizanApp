export interface LocalSession {
  userId: string
  householdId: string
  householdName: string
  displayName: string
  contact: string
  locale: string
  verified: boolean
  role: string
  baseCurrency: string
  /** Base-currency changes so far, and how many this member's private records have been converted for (ADR currency-1). */
  baseGeneration?: number
  rebasedGeneration?: number
  /** ISO 3166 alpha-2; Iraq gets the Baghdad market screens. */
  country?: string
  /** Followed on the Prices screen; empty means the defaults for the country. */
  trackedCurrencies?: string[]
  monthStartDay: number
  deletionRequestedAt: string | null
  householdDeletionRequestedAt: string | null
  /** Runs the service (ADR admin-1); the server still checks on every admin call. */
  operator?: boolean
}
