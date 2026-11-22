import { Star, Trash2, UserPlus } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Role } from "@/api/household"
import { Field } from "@/components/Field"
import { HelpButton } from "@/components/HelpButton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INVITE_ROLES, type HouseholdPageModel } from "../useHouseholdPage"

const card = "flex min-w-0 flex-col gap-3 rounded-[10px] border border-border bg-card p-5 shadow-card"
const title = "text-base leading-[22px] font-semibold"
const meta = "text-[13px] text-muted-foreground"
const pill = "inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-xs font-semibold whitespace-nowrap"
const TONES = ["bg-primary text-primary-foreground", "bg-bucket-1 text-background", "bg-bucket-5 text-background", "bg-bucket-2 text-background", "bg-bucket-4 text-background", "bg-bucket-6 text-background"]

/** Soft: members as a table beside the invite card, then household settings beside the delete card. */
export default function HouseholdSoft({ model }: { model: HouseholdPageModel }) {
  const { t } = useTranslation()
  const { session, canManage, date } = model
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl">{t("household.title")}</h1>
        <HelpButton tour="household" />
      </div>

      {model.offline && <Alert><AlertDescription>{t("household.needsOnline")}</AlertDescription></Alert>}

      {session?.householdDeletionRequestedAt && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-warning-soft px-4 py-3 text-sm">
          <span>{t("household.deletionPending", { date: date(session.householdDeletionRequestedAt) })}</span>
          {canManage && <Button size="sm" onClick={model.cancelDeletion}>{t("household.cancelDeletion")}</Button>}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <section data-tour="household-members" className={`${card} shadow-sheet ${canManage ? "lg:col-span-8" : "lg:col-span-12"}`}>
          <div>
            <h2 className={title}>{t("household.members")}</h2>
            <p className={meta}>{t("household.membersBody")}</p>
          </div>
          {model.members.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-muted-foreground [&>th]:px-2 [&>th]:py-2 [&>th]:text-start [&>th]:font-semibold">
                    <th>{t("household.table.name")}</th>
                    <th>{t("household.table.contact")}</th>
                    <th>{t("household.table.joined")}</th>
                    <th>{t("household.role")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {model.members.map((member, index) => {
                    const editable = canManage && !member.you && member.role !== "OWNER"
                    return (
                      <tr key={member.userId} className="border-t border-border [&>td]:px-2 [&>td]:py-2.5">
                        <td>
                          <span className={`flex items-center gap-2.5 ${member.you ? "font-semibold" : ""}`}>
                            <span aria-hidden className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${TONES[index % TONES.length]}`}>{member.displayName.trim().charAt(0).toUpperCase()}</span>
                            <span className="min-w-0">{member.displayName}{member.you && ` (${t("household.you")})`}</span>
                          </span>
                        </td>
                        <td className="text-muted-foreground" dir="ltr"><span className="block text-start">{member.contact}</span></td>
                        <td className="whitespace-nowrap tabular-nums">{date(member.joinedAt)}</td>
                        <td>
                          <span className="flex flex-wrap items-center gap-1.5">
                            {editable ? (
                              <Select value={member.role} onValueChange={(role) => model.changeRole(member, role as Role)}>
                                <SelectTrigger size="sm" className="w-[130px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{INVITE_ROLES.map((r) => <SelectItem key={r} value={r}>{t(`household.roles.${r}`)}</SelectItem>)}</SelectContent>
                              </Select>
                            ) : member.role === "OWNER" ? (
                              <span className={`${pill} bg-gold-soft text-foreground`}><Star className="size-3.5 fill-gold text-gold" />{t("household.roles.OWNER")}</span>
                            ) : (
                              <span className={`${pill} bg-muted text-muted-foreground`}>{t(`household.roles.${member.role}`)}</span>
                            )}
                            {member.expiresAt && <span className={`${pill} bg-warning-soft text-foreground`}>{t("household.until", { date: date(member.expiresAt) })}</span>}
                          </span>
                        </td>
                        <td>
                          {editable && (
                            <span className="flex flex-wrap justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => model.makeOwner(member)}>{t("household.makeOwner")}</Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => model.remove(member)}>{t("household.remove")}</Button>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {model.members.length === 0 && !model.offline && <p className="text-muted-foreground">{t("household.loading")}</p>}
          <p className={meta}>{t("household.rolesHint")}</p>
        </section>

        {canManage && (
          <section data-tour="household-invite" className={`${card} lg:col-span-4`}>
            <h2 className={title}>{t("household.invite")}</h2>
            <p className={meta}>{t("household.inviteBody")}</p>
            <form onSubmit={model.invite} className="flex flex-col gap-3">
              <Field id="role" label={t("household.role")}>
                <Select value={model.inviteRole} onValueChange={(v) => model.setInviteRole(v as Role)}>
                  <SelectTrigger id="role" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{INVITE_ROLES.map((r) => <SelectItem key={r} value={r}>{t(`household.roles.${r}`)}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field id="contact" label={t("household.contact")}>
                <Input id="contact" value={model.inviteContact} onChange={(e) => model.setInviteContact(e.target.value)} placeholder={t("household.contactHint")} maxLength={160} />
              </Field>
              <Field id="accessDays" label={t("household.accessDays")} hint={t("household.accessDaysHint")}>
                <Input id="accessDays" type="number" min={1} max={365} dir="ltr" className="w-32" value={model.accessDays} onChange={(e) => model.setAccessDays(e.target.value)} placeholder={model.inviteRole === "ADVISOR" ? "30" : "∞"} />
              </Field>
              <Button type="submit" className="h-10"><UserPlus /> {t("household.createLink")}</Button>
            </form>
            {model.lastLink && (
              <div className="flex flex-col gap-2 rounded-lg bg-info-soft p-3">
                <span className="text-sm break-all" dir="ltr">{model.lastLink}</span>
                <Button size="sm" className="self-start" onClick={() => void model.copy(model.lastLink ?? "")}>{t("household.copyLink")}</Button>
              </div>
            )}
            {model.invitations.map((invitation) => (
              <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-sm">
                <span className="min-w-0 flex-1">{t(`household.roles.${invitation.role}`)}{invitation.contact ? ` · ${invitation.contact}` : ""} · {t("household.expires", { date: date(invitation.expiresAt) })}</span>
                <Button size="sm" variant="outline" onClick={() => model.revoke(invitation)}>{t("household.revoke")}</Button>
              </div>
            ))}
          </section>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className={`${card} ${canManage && !session?.householdDeletionRequestedAt ? "lg:col-span-8" : "lg:col-span-12"}`}>
          <h2 className={title}>{t("settings.household")}</h2>
          <form onSubmit={model.saveSettings} className="flex flex-col gap-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field id="householdName" label={t("settings.householdName")}>
                <Input id="householdName" value={model.name} onChange={(e) => model.setName(e.target.value)} maxLength={80} required disabled={!model.mayEdit} />
              </Field>
              <Field id="monthStartDay" label={t("settings.monthStartDay")}>
                <Input id="monthStartDay" type="number" min={1} max={28} dir="ltr" value={model.monthStartDay} onChange={(e) => model.setMonthStartDay(Number(e.target.value))} disabled={!model.mayEdit} />
              </Field>
            </div>
            {model.mayEdit && <Button type="submit" variant="secondary" className="self-start">{t("accounts.save")}</Button>}
          </form>
        </section>

        {canManage && !session?.householdDeletionRequestedAt && (
          <section className={`${card} border-destructive/40 lg:col-span-4`}>
            <h2 className={title}>{t("household.deleteTitle")}</h2>
            <p className={meta}>{t("household.deleteBody")}</p>
            <Button variant="outline" className="self-start border-destructive/40 text-destructive hover:text-destructive" onClick={() => model.setConfirmDelete(true)}><Trash2 /> {t("household.delete")}</Button>
          </section>
        )}
      </div>

      <section data-tour="household-switch" className={card}>
        <div>
          <h2 className={title}>{t("household.yours")}</h2>
          <p className={meta}>{t("household.yoursBody")}</p>
        </div>
        <div className="flex flex-col">
          {model.memberships.map((m) => (
            <div key={m.householdId} className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-t border-border py-2 first:border-t-0">
              <span className="flex min-w-0 flex-wrap items-center gap-2">{m.householdName}<span className={`${pill} bg-muted text-muted-foreground`}>{t(`household.roles.${m.role}`)}</span></span>
              {m.current
                ? <span className={`${pill} bg-success-soft text-success`}>{t("household.current")}</span>
                : <Button size="sm" variant="outline" onClick={() => model.switchTo(m)}>{t("household.switch")}</Button>}
            </div>
          ))}
        </div>
        <form onSubmit={model.joinWithLink} className="flex flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 sm:max-w-md">
            <Field id="joinToken" label={t("household.joinWithLink")}>
              <Input id="joinToken" dir="ltr" value={model.joinToken} onChange={(e) => model.setJoinToken(e.target.value)} placeholder={`${location.origin}/join/…`} />
            </Field>
          </div>
          <Button type="submit" variant="secondary">{t("household.join")}</Button>
        </form>
        {session?.role !== "OWNER" && (
          <div className="flex flex-col gap-1">
            <Button variant="outline" className="self-start" onClick={model.leave}>{t("household.leave")}</Button>
            <p className="text-xs text-muted-foreground">{t("household.leaveNote")}</p>
          </div>
        )}
      </section>
    </div>
  )
}
