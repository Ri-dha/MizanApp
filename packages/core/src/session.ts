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
  monthStartDay: number
  deletionRequestedAt: string | null
  householdDeletionRequestedAt: string | null
  /** Runs the service (ADR admin-1); the server still checks on every admin call. */
  operator?: boolean
}
