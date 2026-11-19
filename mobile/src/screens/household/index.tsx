import { router, Stack } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Share, StyleSheet, View } from "react-native"

import { updateHousehold } from "@mizan/core/auth/session"
import {
  cancelHouseholdDeletion, changeRole, createInvitation, leaveHousehold, listInvitations, listMembers, listMemberships,
  removeMember, revokeInvitation, switchHousehold, transferOwnership, type Role,
} from "@mizan/core/auth/household"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { useSession } from "@/hooks/use-core"
import { WEB_ORIGIN } from "@/platform/api-client"
import { spacing } from "@/theme"
import { describeError } from "@/utils/errors"
import { invitationToken } from "./token"
import { useScreenTour } from "@/tours"

type Member = Awaited<ReturnType<typeof listMembers>>[number]
type Invitation = Awaited<ReturnType<typeof listInvitations>>[number]
type Membership = Awaited<ReturnType<typeof listMemberships>>[number]

const INVITE_ROLES: Role[] = ["MEMBER", "VIEWER", "DEPENDENT", "ADVISOR"]
const MAX_START_DAY = 28

export function Household() {
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
  const date = (iso: string) => new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-IQ-u-nu-latn" : "en-GB", { dateStyle: "medium" }).format(new Date(iso))

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
  useScreenTour("household", members.length > 0)
  return (
    <Screen>
      <Stack.Screen options={{ title: t("household.title") }} />
      {offline ? <Notice>{t("household.needsOnline")}</Notice> : null}
      {message ? <Notice>{message}</Notice> : null}
      {session?.householdDeletionRequestedAt ? (
        <View style={styles.section}>
          <Notice tone="error">{t("household.deletionPending", { date: date(session.householdDeletionRequestedAt) })}</Notice>
          {canManage ? <Button title={t("household.cancelDeletion")} onPress={() => void run(async () => { await cancelHouseholdDeletion(); await updateHousehold({}) }, t("household.deletionCancelled"))} /> : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText variant="headline">{t("household.members")}</ThemedText>
        <ThemedText variant="caption">{t("household.membersBody")}</ThemedText>
        <Group>
          {members.length === 0 && !offline ? <Row last><ThemedText variant="subhead">{t("household.loading")}</ThemedText></Row> : null}
          {members.map((member, index) => {
            const manageable = canManage && !member.you && member.role !== "OWNER"
            return (
              <Row
                key={member.userId}
                testID={`member-${member.userId}`}
                last={index === members.length - 1}
                trailing={manageable ? <Button variant="ghost" title="…" accessibilityLabel={t("household.memberActions")} onPress={() => memberActions(member)} /> : <ThemedText variant="subhead">{t(`household.roles.${member.role}`)}</ThemedText>}
              >
                <ThemedText>{member.you ? `${member.displayName} · ${t("household.you")}` : member.displayName}</ThemedText>
                <ThemedText variant="caption">
                  {`${member.contact} · ${t("household.since", { date: date(member.joinedAt) })}${member.expiresAt ? ` · ${t("household.until", { date: date(member.expiresAt) })}` : ""}`}
                </ThemedText>
                {manageable ? (
                  <Chips options={INVITE_ROLES.map((r) => ({ value: r, label: t(`household.roles.${r}`) }))} value={member.role} onChange={(role) => role && role !== member.role && void run(() => changeRole(member.userId, role as Role), t("household.roleChanged"))} />
                ) : null}
              </Row>
            )
          })}
        </Group>
        <ThemedText variant="caption">{t("household.rolesHint")}</ThemedText>
      </View>

      {canManage ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{t("household.invite")}</ThemedText>
          <ThemedText variant="caption">{t("household.inviteBody")}</ThemedText>
          <TextField testID="invite-contact" label={t("household.contact")} placeholder={t("household.contactHint")} maxLength={160} autoCapitalize="none" value={inviteContact} onChangeText={setInviteContact} />
          <Chips testID="invite-role" options={INVITE_ROLES.map((r) => ({ value: r, label: t(`household.roles.${r}`) }))} value={inviteRole} onChange={(next) => next && setInviteRole(next as Role)} />
          <TextField testID="invite-days" label={t("household.accessDays")} keyboardType="number-pad" placeholder={inviteRole === "ADVISOR" ? "30" : "∞"} value={accessDays} onChangeText={setAccessDays} />
          <ThemedText variant="caption">{t("household.accessDaysHint")}</ThemedText>
          <Button testID="create-invite" title={t("household.createLink")} onPress={() => void invite()} />
          {lastLink ? (
            <Group>
              <Row last trailing={<Button testID="share-invite" variant="ghost" title={t("household.shareLink")} onPress={() => void Share.share({ message: lastLink })} />}>
                <ThemedText testID="invite-link" variant="caption" selectable>{lastLink}</ThemedText>
              </Row>
            </Group>
          ) : null}
          {invitations.length > 0 ? (
            <Group>
              {invitations.map((invitation, index) => (
                <Row
                  key={invitation.id}
                  last={index === invitations.length - 1}
                  trailing={<Button testID={`revoke-${invitation.id}`} variant="ghost" title={t("household.revoke")} onPress={() => void run(() => revokeInvitation(invitation.id), t("household.revoked"))} />}
                >
                  <ThemedText>{`${t(`household.roles.${invitation.role}`)}${invitation.contact ? ` · ${invitation.contact}` : ""}`}</ThemedText>
                  <ThemedText variant="caption">{t("household.expires", { date: date(invitation.expiresAt) })}</ThemedText>
                </Row>
              ))}
            </Group>
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText variant="headline">{t("settings.household")}</ThemedText>
        <TextField testID="household-name" label={t("settings.householdName")} maxLength={80} editable={canEdit} value={name} onChangeText={setName} />
        <TextField testID="household-start-day" label={t("settings.monthStartDay")} keyboardType="number-pad" maxLength={2} editable={canEdit} value={monthStartDay} onChangeText={setMonthStartDay} />
        {canEdit ? (
          <Button
            testID="save-household"
            variant="secondary"
            title={t("accounts.save")}
            disabled={!name.trim()}
            onPress={() => void run(() => updateHousehold({ name: name.trim(), monthStartDay: Math.min(MAX_START_DAY, Math.max(1, Number(monthStartDay) || 1)) }), t("settings.saved"))}
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <ThemedText variant="headline">{t("household.yours")}</ThemedText>
        <ThemedText variant="caption">{t("household.yoursBody")}</ThemedText>
        <Group>
          {memberships.map((m, index) => (
            <Row
              key={m.householdId}
              last={index === memberships.length - 1}
              trailing={m.current
                ? <ThemedText variant="subhead">{t("household.current")}</ThemedText>
                : <Button testID={`switch-${m.householdId}`} variant="ghost" title={t("household.switch")} onPress={() => void rebuild(() => switchHousehold(m.householdId), t("household.switched", { name: m.householdName }))} />}
            >
              <ThemedText>{m.householdName}</ThemedText>
              <ThemedText variant="caption">{t(`household.roles.${m.role}`)}</ThemedText>
            </Row>
          ))}
        </Group>
        <TextField testID="join-link" label={t("household.joinWithLink")} autoCapitalize="none" autoCorrect={false} placeholder={`${WEB_ORIGIN}/join/…`} value={joinLink} onChangeText={setJoinLink} />
        <Button testID="join-household" variant="secondary" title={t("household.join")} disabled={!token} onPress={() => router.push({ pathname: "/join/[token]", params: { token } })} />
        {session?.role !== "OWNER" ? (
          <>
            <Button testID="leave-household" variant="destructive" title={t("household.leave")} onPress={confirmLeave} />
            <ThemedText variant="caption">{t("household.leaveNote")}</ThemedText>
          </>
        ) : null}
      </View>

      {canManage && !session?.householdDeletionRequestedAt ? (
        <View style={styles.section}>
          <ThemedText variant="headline">{t("household.deleteTitle")}</ThemedText>
          <ThemedText variant="caption">{t("household.deleteBody")}</ThemedText>
          <Button testID="delete-household" variant="destructive" title={t("household.delete")} onPress={() => router.push("/household-delete")} />
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
})
