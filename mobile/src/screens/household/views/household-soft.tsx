import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Badge, Card, Section } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import type { HouseholdScreenModel } from "../use-household-screen"

/** Soft: members with an initial and a role badge, then the invite, the household's details and your households, each in a card. */
export function HouseholdSoft({ model }: { model: HouseholdScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { invite, details, join } = model
  return (
    <>
      {model.offline ? <Notice>{t("household.needsOnline")}</Notice> : null}
      {model.message ? <Notice>{model.message}</Notice> : null}
      {model.deletion ? (
        <View style={styles.stack}>
          <Notice tone="error">{model.deletion.notice}</Notice>
          {model.canManage ? <Button title={t("household.cancelDeletion")} onPress={model.deletion.cancel} /> : null}
        </View>
      ) : null}

      <Section title={t("household.members")} note={t("household.membersBody")}>
        <Group>
          {model.loadingMembers ? <Row last><ThemedText variant="subhead">{t("household.loading")}</ThemedText></Row> : null}
          {model.members.map((member, index) => (
            <Row
              key={member.id}
              testID={`member-${member.id}`}
              last={index === model.members.length - 1}
              trailing={member.manageable
                ? <Button variant="ghost" title="…" accessibilityLabel={t("household.memberActions")} onPress={member.actions} />
                : <Badge tone={member.owner ? "gold" : "neutral"}>{member.roleLabel}</Badge>}
            >
              <View style={styles.member}>
                <View style={styles.avatar}><ThemedText variant="subhead" style={styles.initial}>{member.initial}</ThemedText></View>
                <View style={styles.grow}>
                  <ThemedText numberOfLines={1}>{member.name}</ThemedText>
                  <ThemedText variant="caption">{member.detail}</ThemedText>
                </View>
              </View>
              {member.manageable ? <Chips options={model.roleOptions} value={member.role} onChange={member.changeRole} /> : null}
            </Row>
          ))}
        </Group>
        <ThemedText variant="caption">{t("household.rolesHint")}</ThemedText>
      </Section>

      {model.canManage ? (
        <Section title={t("household.invite")} note={t("household.inviteBody")}>
          <Card style={styles.form}>
            <TextField testID="invite-contact" label={t("household.contact")} placeholder={t("household.contactHint")} maxLength={160} autoCapitalize="none" value={invite.contact} onChangeText={invite.setContact} />
            <Chips testID="invite-role" options={model.roleOptions} value={invite.role} onChange={invite.setRole} />
            <TextField testID="invite-days" label={t("household.accessDays")} keyboardType="number-pad" placeholder={invite.daysPlaceholder} value={invite.days} onChangeText={invite.setDays} />
            <ThemedText variant="caption">{t("household.accessDaysHint")}</ThemedText>
            <Button testID="create-invite" title={t("household.createLink")} onPress={invite.create} />
            {invite.lastLink ? (
              <View style={styles.link}>
                <ThemedText testID="invite-link" variant="caption" selectable style={styles.grow}>{invite.lastLink}</ThemedText>
                <Button testID="share-invite" variant="ghost" title={t("household.shareLink")} onPress={invite.share} />
              </View>
            ) : null}
          </Card>
          {model.invitations.length > 0 ? (
            <Group>
              {model.invitations.map((invitation, index) => (
                <Row key={invitation.id} last={index === model.invitations.length - 1} trailing={<Button testID={`revoke-${invitation.id}`} variant="ghost" title={t("household.revoke")} onPress={invitation.revoke} />}>
                  <ThemedText>{invitation.title}</ThemedText>
                  <ThemedText variant="caption">{invitation.detail}</ThemedText>
                </Row>
              ))}
            </Group>
          ) : null}
        </Section>
      ) : null}

      <Section title={t("settings.household")}>
        <Card style={styles.form}>
          <TextField testID="household-name" label={t("settings.householdName")} maxLength={80} editable={model.canEdit} value={details.name} onChangeText={details.setName} />
          <TextField testID="household-start-day" label={t("settings.monthStartDay")} keyboardType="number-pad" maxLength={2} editable={model.canEdit} value={details.monthStartDay} onChangeText={details.setMonthStartDay} />
          {model.canEdit ? <Button testID="save-household" variant="secondary" title={t("accounts.save")} disabled={!details.canSave} onPress={details.save} /> : null}
        </Card>
      </Section>

      <Section title={t("household.yours")} note={t("household.yoursBody")}>
        <Group>
          {model.memberships.map((m, index) => (
            <Row
              key={m.id}
              last={index === model.memberships.length - 1}
              trailing={m.current ? <Badge tone="info">{t("household.current")}</Badge> : <Button testID={`switch-${m.id}`} variant="ghost" title={t("household.switch")} onPress={m.switchTo} />}
            >
              <ThemedText>{m.name}</ThemedText>
              <ThemedText variant="caption">{m.roleLabel}</ThemedText>
            </Row>
          ))}
        </Group>
        <Card style={styles.form}>
          <TextField testID="join-link" label={t("household.joinWithLink")} autoCapitalize="none" autoCorrect={false} placeholder={join.placeholder} value={join.link} onChangeText={join.setLink} />
          <Button testID="join-household" variant="secondary" title={t("household.join")} disabled={!join.canJoin} onPress={join.open} />
        </Card>
        {model.leave ? (
          <>
            <Button testID="leave-household" variant="destructive" title={t("household.leave")} onPress={model.leave} />
            <ThemedText variant="caption">{t("household.leaveNote")}</ThemedText>
          </>
        ) : null}
      </Section>

      {model.remove ? (
        <Section title={t("household.deleteTitle")} note={t("household.deleteBody")}>
          <Button testID="delete-household" variant="destructive" title={t("household.delete")} onPress={model.remove} />
        </Section>
      ) : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  stack: { gap: spacing.sm },
  form: { gap: spacing.sm + spacing.xs },
  member: { flexDirection: "row", alignItems: "center", gap: spacing.sm + spacing.xs },
  avatar: { width: 32, height: 32, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent },
  initial: { color: colors.onAccent, fontWeight: "600" },
  grow: { flex: 1 },
  link: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
}))
