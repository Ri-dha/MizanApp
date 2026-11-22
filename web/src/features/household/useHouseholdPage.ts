import { useCallback, useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { updateHousehold, useSession } from "@/api/auth"
import { acceptInvitation, cancelHouseholdDeletion, changeRole, createInvitation, leaveHousehold, listInvitations, listMembers, listMemberships, removeMember, requestHouseholdDeletion, revokeInvitation, switchHousehold, transferOwnership, type Role } from "@/api/household"
import { DATE, formatWhen } from "@/app/dates"
import { describeError } from "@/app/errors"
import { useScreenTour } from "@/tours/useTour"

export type Member = Awaited<ReturnType<typeof listMembers>>[number]
export type Invitation = Awaited<ReturnType<typeof listInvitations>>[number]
export type Membership = Awaited<ReturnType<typeof listMemberships>>[number]

export const INVITE_ROLES: Role[] = ["MEMBER", "VIEWER", "DEPENDENT", "ADVISOR"]

export function useHouseholdPage() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [name, setName] = useState(session?.householdName ?? "")
  const [monthStartDay, setMonthStartDay] = useState(session?.monthStartDay ?? 1)
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER")
  const [inviteContact, setInviteContact] = useState("")
  const [accessDays, setAccessDays] = useState("")
  const [lastLink, setLastLink] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [joinToken, setJoinToken] = useState("")
  const [offline, setOffline] = useState(!navigator.onLine)
  useScreenTour("household", members.length > 0)

  const canManage = session?.role === "OWNER"
  const date = (iso: string) => formatWhen(iso, i18n.language, DATE)

  const load = useCallback(async () => {
    try {
      const [m, ms] = await Promise.all([listMembers(), listMemberships()])
      setMembers(m)
      setMemberships(ms)
      if (canManage) setInvitations(await listInvitations())
      setOffline(false)
    } catch (e) {
      setOffline(true)
      if (navigator.onLine) toast(describeError(e))
    }
  }, [canManage])

  useEffect(() => {
    void load()
  }, [load])

  async function run(action: () => Promise<unknown>, done?: string) {
    try {
      await action()
      if (done) toast(done)
      await load()
    } catch (e) {
      toast(describeError(e))
    }
  }

  async function rebuild(action: () => Promise<void>, done: string) {
    try {
      await action()
      toast(done)
      navigate("/")
    } catch (e) {
      toast(describeError(e))
    }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault()
    await run(() => updateHousehold({ name, monthStartDay }), t("settings.saved"))
  }

  async function invite(event: FormEvent) {
    event.preventDefault()
    try {
      const created = await createInvitation(inviteRole, inviteContact.trim() || null, accessDays.trim() ? Number(accessDays) : null)
      setLastLink(`${location.origin}/join/${created.token}`)
      setInviteContact("")
      await load()
    } catch (e) {
      toast(describeError(e))
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast(t("household.copied"))
    } catch {
      toast(text)
    }
  }

  function joinWithLink(event: FormEvent) {
    event.preventDefault()
    const token = joinToken.trim().split("/").pop() ?? ""
    if (token) void rebuild(() => acceptInvitation(token), t("household.joined"))
  }

  function submitDelete(event: FormEvent) {
    event.preventDefault()
    void run(async () => {
      await requestHouseholdDeletion(password)
      await updateHousehold({})
      setConfirmDelete(false)
      setPassword("")
    }, t("household.deletionRequested"))
  }

  return {
    session, canManage, mayEdit: canManage || session?.role === "MEMBER", offline, date,
    members, invitations, memberships,
    name, setName, monthStartDay, setMonthStartDay, saveSettings,
    inviteRole, setInviteRole, inviteContact, setInviteContact, accessDays, setAccessDays, lastLink, invite, copy,
    joinToken, setJoinToken, joinWithLink,
    password, setPassword, confirmDelete, setConfirmDelete, submitDelete,
    cancelDeletion: () => void run(async () => { await cancelHouseholdDeletion(); await updateHousehold({}) }, t("household.deletionCancelled")),
    changeRole: (member: Member, role: Role) => void run(() => changeRole(member.userId, role), t("household.roleChanged")),
    makeOwner: (member: Member) => void run(() => transferOwnership(member.userId).then(() => updateHousehold({})), t("household.transferred")),
    remove: (member: Member) => void run(() => removeMember(member.userId), t("household.removed")),
    revoke: (invitation: Invitation) => void run(() => revokeInvitation(invitation.id), t("household.revoked")),
    switchTo: (m: Membership) => void rebuild(() => switchHousehold(m.householdId), t("household.switched", { name: m.householdName })),
    leave: () => void rebuild(leaveHousehold, t("household.left")),
  }
}

export type HouseholdPageModel = ReturnType<typeof useHouseholdPage>
