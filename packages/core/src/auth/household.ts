import { api, unwrap } from "../api/client"
import { resetSyncState, syncNow } from "../sync/engine"
import { authHost, authKeyFor, clearHouseholdData, rememberFromServer } from "./session"

export type Role = "OWNER" | "MEMBER" | "VIEWER" | "DEPENDENT" | "ADVISOR"

export const listMembers = () => unwrap(api().GET("/api/v1/households/current/members"))
export const listInvitations = () => unwrap(api().GET("/api/v1/households/current/invitations"))
export const listMemberships = () => unwrap(api().GET("/api/v1/households"))
export const createInvitation = (role: Role, contact: string | null, accessDays: number | null = null) =>
  unwrap(api().POST("/api/v1/households/current/invitations", { body: { role, contact: contact ?? undefined, accessDays: accessDays ?? undefined } }))
export const revokeInvitation = (id: string) => unwrap(api().DELETE("/api/v1/households/current/invitations/{invitationId}", { params: { path: { invitationId: id } } }))
export const changeRole = (userId: string, role: Role) =>
  unwrap(api().PATCH("/api/v1/households/current/members/{userId}", { params: { path: { userId } }, body: { role } }))
export const removeMember = (userId: string) => unwrap(api().DELETE("/api/v1/households/current/members/{userId}", { params: { path: { userId } } }))
export const transferOwnership = (userId: string) => unwrap(api().POST("/api/v1/households/current/transfer-ownership", { body: { userId } }))
export const requestHouseholdDeletion = async (password: string) => unwrap(api().POST("/api/v1/households/current/deletion-request", { body: { authKey: await authKeyFor(password) } }))
export const cancelHouseholdDeletion = () => unwrap(api().DELETE("/api/v1/households/current/deletion-request"))
export const previewInvitation = (token: string) => unwrap(api().GET("/api/v1/invitations/{token}", { params: { path: { token } } }))

/** The token carries the household, so after a change of household the session is rebuilt from scratch. */
async function rebuildSession() {
  if (!(await authHost().refreshTokens())) throw new Error("SESSION_REFRESH_FAILED")
  await clearHouseholdData()
  await resetSyncState()
  await rememberFromServer(null)
  await syncNow()
}

export async function acceptInvitation(token: string) {
  await unwrap(api().POST("/api/v1/invitations/{token}/accept", { params: { path: { token } } }))
  await rebuildSession()
}

export async function switchHousehold(householdId: string) {
  await unwrap(api().POST("/api/v1/households/{householdId}/switch", { params: { path: { householdId } } }))
  await rebuildSession()
}

export async function leaveHousehold() {
  await unwrap(api().POST("/api/v1/households/current/leave"))
  await rebuildSession()
}
