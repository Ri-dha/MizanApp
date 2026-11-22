import { router } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Share } from "react-native"

import {
  cancelHouseholdDeletion, changeRole, createInvitation, leaveHousehold, listInvitations, listMembers, listMemberships,
  removeMember, revokeInvitation, switchHousehold, transferOwnership, type Role,
} from "@mizan/core/auth/household"
import { updateHousehold } from "@mizan/core/auth/session"
import { useSession } from "@/hooks/use-core"
import { WEB_ORIGIN } from "@/platform/api-client"
import { useScreenTour } from "@/tours"
import { DATE, formatWhen } from "@/utils/dates"
import { describeError } from "@/utils/errors"
import { invitationToken } from "./token"

type Member = Awaited<ReturnType<typeof listMembers>>[number]
type Invitation = Awaited<ReturnType<typeof listInvitations>>[number]
type Membership = Awaited<ReturnType<typeof listMemberships>>[number]

const INVITE_ROLES: Role[] = ["MEMBER", "VIEWER", "DEPENDENT", "ADVISOR"]
const MAX_START_DAY = 28

/** Everything the Household screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useHouseholdScreen() {
  const { t, i18n } = useTranslation()
  const session = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [name, setName] = useState(session?.householdName ?? "")
  const [monthStartDay, setMonthStartDay] = useState(String(session?.monthStartDay ?? 1))
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER")
  const [inviteContact, setInviteContact] = useState("")
  const [accessDays, setAccessDays] = useState("")
  const [lastLink, setLastLink] = useState<string | null>(null)
  const [joinLink, setJoinLink] = useState("")
  const [offline, setOffline] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const canManage = session?.role === "OWNER"
  const canEdit = canManage || session?.role === "MEMBER"
  const date = (iso: string) => formatWhen(iso, i18n.language, DATE)
  const roleLabel = (role: string) => t(`household.roles.${role}`)

  const load = useCallback(async () => {
    try {
      const [m, ms] = await Promise.all([listMembers(), listMemberships()])
      setMembers(m)
      setMemberships(ms)
      if (canManage) setInvitations(await listInvitations())
      setOffline(false)
    } catch {
      setOffline(true)
    }
  }, [canManage])

  useEffect(() => {
    void load()
  }, [load])
  useScreenTour("household", members.length > 0)

  async function run(action: () => Promise<unknown>, done?: string) {
    try {
      await action()
      if (done) setMessage(done)
      await load()
    } catch (e) {
      setMessage(describeError(e))
    }
  }

  async function rebuild(action: () => Promise<void>, done: string) {
    try {
      await action()
      setMessage(done)
      router.dismissTo("/")
    } catch (e) {
      setMessage(describeError(e))
    }
  }

  async function invite() {
    try {
      const created = await createInvitation(inviteRole, inviteContact.trim() || null, accessDays.trim() ? Number(accessDays) : null)
      setLastLink(`${WEB_ORIGIN}/join/${created.token}`)
      setInviteContact("")
      await load()
    } catch (e) {
      setMessage(describeError(e))
    }
  }

  function memberActions(member: Member) {
    Alert.alert(member.displayName, undefined, [
      { text: t("household.makeOwner"), onPress: () => void run(() => transferOwnership(member.userId).then(() => updateHousehold({})), t("household.transferred")) },
      { text: t("household.remove"), style: "destructive", onPress: () => void run(() => removeMember(member.userId), t("household.removed")) },
      { text: t("common.cancel"), style: "cancel" },
    ])
  }

  function confirmLeave() {
    Alert.alert(t("household.leave"), t("household.leaveNote"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("household.leave"), style: "destructive", onPress: () => void rebuild(leaveHousehold, t("household.left")) },
    ])
  }

  const token = invitationToken(joinLink)
  const deletionAt = session?.householdDeletionRequestedAt ?? null
  return {
    offline, message, canManage, canEdit,
    loadingMembers: members.length === 0 && !offline,
    deletion: deletionAt ? {
      notice: t("household.deletionPending", { date: date(deletionAt) }),
      cancel: () => void run(async () => { await cancelHouseholdDeletion(); await updateHousehold({}) }, t("household.deletionCancelled")),
    } : null,
    roleOptions: INVITE_ROLES.map((r) => ({ value: r as string, label: roleLabel(r) })),
    members: members.map((member) => {
      const manageable = canManage && !member.you && member.role !== "OWNER"
      return {
        id: member.userId,
        initial: member.displayName.trim().charAt(0).toUpperCase(),
        name: member.you ? `${member.displayName} · ${t("household.you")}` : member.displayName,
        detail: `${member.contact} · ${t("household.since", { date: date(member.joinedAt) })}${member.expiresAt ? ` · ${t("household.until", { date: date(member.expiresAt) })}` : ""}`,
        role: member.role as string,
        roleLabel: roleLabel(member.role),
        owner: member.role === "OWNER",
        manageable,
        actions: () => memberActions(member),
        changeRole: (role: string | null) => { if (role && role !== member.role) void run(() => changeRole(member.userId, role as Role), t("household.roleChanged")) },
      }
    }),
    invite: {
      contact: inviteContact, setContact: setInviteContact,
      role: inviteRole as string, setRole: (next: string | null) => { if (next) setInviteRole(next as Role) },
      days: accessDays, setDays: setAccessDays,
      daysPlaceholder: inviteRole === "ADVISOR" ? "30" : "∞",
      create: () => void invite(),
      lastLink,
      share: () => { if (lastLink) void Share.share({ message: lastLink }) },
    },
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      title: `${roleLabel(invitation.role)}${invitation.contact ? ` · ${invitation.contact}` : ""}`,
      detail: t("household.expires", { date: date(invitation.expiresAt) }),
      revoke: () => void run(() => revokeInvitation(invitation.id), t("household.revoked")),
    })),
    details: {
      name, setName, monthStartDay, setMonthStartDay,
      canSave: !!name.trim(),
      save: () => void run(() => updateHousehold({ name: name.trim(), monthStartDay: Math.min(MAX_START_DAY, Math.max(1, Number(monthStartDay) || 1)) }), t("settings.saved")),
    },
    memberships: memberships.map((m) => ({
      id: m.householdId,
      name: m.householdName,
      roleLabel: roleLabel(m.role),
      current: m.current,
      switchTo: () => void rebuild(() => switchHousehold(m.householdId), t("household.switched", { name: m.householdName })),
    })),
    join: {
      link: joinLink, setLink: setJoinLink,
      placeholder: `${WEB_ORIGIN}/join/…`,
      canJoin: !!token,
      open: () => router.push({ pathname: "/join/[token]", params: { token } }),
    },
    leave: session?.role !== "OWNER" ? confirmLeave : null,
    remove: canManage && !deletionAt ? () => router.push("/household-delete") : null,
  }
}

export type HouseholdScreenModel = ReturnType<typeof useHouseholdScreen>
