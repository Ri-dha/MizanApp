import { Bell, Database, Globe, HardDriveUpload, Layers, Lock, MonitorSmartphone, Palette, ShieldCheck, UserRound, Users, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { DATE, formatWhen } from "@/app/dates"
import { setPreferences, type DigitStyle } from "@/app/preferences"
import { setTheme, type Theme } from "@/app/theme"
import { Field } from "@/components/Field"
import { HelpButton } from "@/components/HelpButton"
import { InstallButton } from "@/components/InstallButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NOTIFICATION_SWITCHES, saveNotificationSettings } from "@/db/notifications"
import { PRIVACY_KINDS, savePrivacyDefault } from "@/db/privacy"
import { CurrencySelect } from "@/features/currency/CurrencySelect"
import { RecoveryCodeCard } from "@/features/vault/VaultScreens"
import { SUPPORTED_LOCALES } from "@/i18n"
import { lock, removePin } from "@/lock/store"
import { isIosBrowser } from "@/notifications/push"
import { AppModeChoice } from "../AppModeChoice"
import { AppStyleChoice } from "../AppStyleChoice"
import { CurrencyCard } from "../CurrencyCard"
import { HomeLayoutCard } from "../HomeLayoutCard"
import type { SettingsPageModel } from "../useSettingsPage"
import { Note, Section, Segmented, ToggleRow } from "./parts"

const LOCK_CHOICES = [0, 30, 60, 300]
const THEMES: Theme[] = ["system", "light", "dark"]
const EXPORT_KINDS = ["transactions", "metals", "assets"] as const

/** Soft: a list of sections beside the page on a wide screen, and one card per section. */
export default function SettingsSoft({ model }: { model: SettingsPageModel }) {
  const { t } = useTranslation()
  const { session, prefs, notify, backup, push } = model
  const unlocked = model.lockState === "unlocked"
  const base = session?.baseCurrency ?? "IQD"

  const sections: { id: string; title: string; show: boolean }[] = [
    { id: "s-language", title: t("settings.languageAndTheme"), show: true },
    { id: "s-security", title: t("settings.security"), show: true },
    { id: "s-recovery", title: t("vault.settingsTitle"), show: true },
    { id: "s-currency", title: t("currency.title"), show: true },
    { id: "s-style", title: t("appStyle.title"), show: true },
    { id: "s-mode", title: t("appMode.title"), show: !model.restricted },
    { id: "s-household", title: t("settings.household"), show: model.mode === "advanced" },
    { id: "s-privacy", title: t("privacy.title"), show: model.writes && model.mode === "advanced" },
    { id: "home", title: t("homeLayout.title"), show: !model.advisor },
    { id: "s-display", title: t("settings.display"), show: true },
    { id: "s-backup", title: t("backup.title"), show: !model.advisor },
    { id: "s-notifications", title: t("settings.notifications"), show: !model.advisor },
    { id: "s-data", title: t("data.title"), show: !model.advisor },
    { id: "s-account", title: t("settings.account"), show: true },
  ]
  const shown = (id: string) => sections.some((s) => s.id === id && s.show)
  const section = (id: string, icon: LucideIcon, tour?: string) => ({ id, icon, tour, title: sections.find((s) => s.id === id)?.title ?? "" })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl">{t("settings.title")}</h1>
        <HelpButton tour="settings" />
      </div>

      <div className="flex items-start gap-6">
        <nav aria-label={t("settings.title")} className="sticky top-4 hidden w-[200px] shrink-0 flex-col gap-0.5 lg:flex">
          {sections.filter((s) => s.show).map((s) => (
            <a key={s.id} href={`#${s.id}`} className="flex min-h-9 items-center rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">{s.title}</a>
          ))}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Section {...section("s-language", Globe)}>
            <Segmented id="language" label={t("settings.language")} value={model.language.startsWith("ar") ? "ar" : "en"}
              options={SUPPORTED_LOCALES.map((locale) => ({ value: locale, label: locale === "ar" ? "العربية" : "English" }))}
              onChange={model.changeLanguage} />
            <Segmented id="theme" label={t("settings.theme")} value={model.theme}
              options={THEMES.map((choice) => ({ value: choice, label: t(`settings.themes.${choice}`) }))}
              onChange={setTheme} />
          </Section>

          <Section {...section("s-security", Lock, "settings-security")}>
            <Segmented id="lockAfter" label={t("settings.lockAfter")} value={String(model.lockAfter)}
              options={LOCK_CHOICES.map((seconds) => ({ value: String(seconds), label: t("settings.seconds", { count: seconds }) }))}
              onChange={(value) => model.setLockAfter(Number(value))} />
            {model.biometricsAvailable && (
              <ToggleRow id="biometrics" label={t("lock.biometricsSwitch")} checked={model.biometricsOn} onChange={(on) => void model.toggleBiometrics(on)} disabled={!unlocked} />
            )}
            <div className="flex flex-wrap gap-2.5">
              <Button variant="secondary" onClick={lock} disabled={!unlocked}><Lock /> {t("lock.title")}</Button>
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => void removePin()}>{t("lock.remove")}</Button>
            </div>
          </Section>

          <div id="s-recovery" className="scroll-mt-4"><RecoveryCodeCard /></div>

          <div id="s-currency" className="scroll-mt-4"><CurrencyCard /></div>

          <Section {...section("s-style", Palette)}>
            <Note>{t("appStyle.body")}</Note>
            <AppStyleChoice value={prefs.appStyle} onChange={(next) => setPreferences({ appStyle: next })} />
          </Section>

          {shown("s-mode") && (
            <Section {...section("s-mode", Layers)}>
              <Note>{t("appMode.body")}</Note>
              <AppModeChoice value={model.mode} onChange={(next) => setPreferences({ appMode: next })} />
            </Section>
          )}

          {shown("s-household") && (
            <Section {...section("s-household", Users)}>
              <Note>{t("settings.householdBody", { name: session?.householdName ?? "", role: t(`household.roles.${session?.role ?? "OWNER"}`) })}</Note>
              <Button variant="secondary" className="self-start" asChild><Link to="/household">{t("household.manage")}</Link></Button>
            </Section>
          )}

          {shown("s-privacy") && (
            <Section {...section("s-privacy", ShieldCheck, "settings-privacy")}>
              <Note>{t("privacy.body")}</Note>
              {PRIVACY_KINDS.map((kind) => (
                <ToggleRow key={kind} id={`privacy-${kind}`} label={t(`privacy.kinds.${kind}`)} checked={model.privacy[kind] === "PRIVATE"}
                  onChange={(on) => void savePrivacyDefault(kind, on ? "PRIVATE" : "SHARED")} />
              ))}
            </Section>
          )}

          {shown("home") && <HomeLayoutCard />}

          <Section {...section("s-display", MonitorSmartphone)}>
            <Segmented id="digits" label={t("settings.digits")} value={prefs.digitStyle}
              options={(["western", "eastern"] as DigitStyle[]).map((style) => ({ value: style, label: t(`settings.digitStyles.${style}`) }))}
              onChange={(style) => setPreferences({ digitStyle: style })} />
            <p className="-mt-1.5 text-xs opacity-70">{t("settings.digitsHint")}</p>
            <Field id="displayCurrency" label={t("currency.showIn")} hint={t("currency.showInHint", { base })}>
              <CurrencySelect id="displayCurrency" value={prefs.displayCurrency ?? base}
                onChange={(code) => setPreferences({ displayCurrency: code === session?.baseCurrency ? null : code })} />
            </Field>
            <ToggleRow id="showUsd" label={t("settings.showUsd")} checked={prefs.showUsd} onChange={(on) => setPreferences({ showUsd: on })} />
            <ToggleRow id="showHijri" label={t("settings.showHijri")} checked={prefs.showHijri} onChange={(on) => setPreferences({ showHijri: on })} />
            <Field id="valuationMonths" label={t("settings.valuationReminder")}>
              <Input id="valuationMonths" type="number" inputMode="numeric" min={1} max={99} className="w-24" value={prefs.valuationReminderMonths}
                onChange={(e) => setPreferences({ valuationReminderMonths: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })} />
            </Field>
            <Note>{t("settings.followsYou")}</Note>
          </Section>

          {shown("s-backup") && (
            <Section {...section("s-backup", HardDriveUpload, "settings-backup")}>
              <Note>{t("backup.body")}</Note>
              {!backup.configured ? (
                <Button className="self-start" onClick={() => model.setPassphraseDialog("set")}>{t("backup.setPassphrase")}</Button>
              ) : (
                <>
                  <ToggleRow id="backupAuto" label={t("backup.automatic")} checked={backup.automatic} onChange={model.setAutomatic} />
                  <p className="text-xs opacity-70">{backup.lastBackupAt ? t("backup.last", { at: formatWhen(backup.lastBackupAt, model.language) }) : t("backup.never")}</p>
                  <div className="flex flex-wrap gap-2.5">
                    <Button variant="secondary" onClick={() => void model.backupNow()}>{t("backup.now")}</Button>
                    <Button variant="secondary" onClick={() => model.setPassphraseDialog("set")}>{t("backup.changePassphrase")}</Button>
                    <Button variant="ghost" onClick={model.forgetPassphrase}>{t("backup.forget")}</Button>
                  </div>
                </>
              )}
              {model.backups.length > 0 && (
                <div className="flex flex-col text-sm">
                  <h3 className="text-[13px] font-semibold text-muted-foreground">{t("backup.list")}</h3>
                  {model.backups.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 border-t border-border py-2 first-of-type:border-t-0">
                      <span className="tabular-nums">{b.uploadedAt ? formatWhen(b.uploadedAt, model.language) : t("backup.pendingUpload")} · {Math.round(b.byteSize / 1024)} KB</span>
                      <Button size="sm" variant="outline" onClick={() => model.setPassphraseDialog({ restore: b })}>{t("backup.restore")}</Button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {shown("s-notifications") && (
            <Section {...section("s-notifications", Bell, "settings-notifications")}>
              <Note>{t("settings.notificationsBody")}</Note>
              {push === "unsupported" && <p className="text-sm">{t("notifications.unsupported")}</p>}
              {push === "denied" && <p className="text-sm">{t("notifications.denied")}</p>}
              {(push === "off" || push === "on") && (
                <ToggleRow id="push" label={t("notifications.onThisDevice")} checked={push === "on"} onChange={(on) => void model.togglePush(on)}>
                  {push === "on" && <Button size="sm" variant="outline" onClick={model.testPush}>{t("notifications.sendTest")}</Button>}
                </ToggleRow>
              )}
              {isIosBrowser() && <p className="text-xs opacity-70">{t("notifications.iosHint")}</p>}
              <ToggleRow id="quiet" label={t("settings.quietMode")} checked={notify.quietMode} onChange={(on) => void saveNotificationSettings({ quietMode: on })} />
              {NOTIFICATION_SWITCHES.map((cls) => (
                <ToggleRow key={cls} id={`n-${cls}`} label={t(`settings.notificationClasses.${cls}`)} disabled={notify.quietMode} checked={notify[cls] && !notify.quietMode}
                  onChange={(on) => void saveNotificationSettings({ [cls]: on })}>
                  {cls === "billDue" && <Input aria-label={t("notifications.leadDays")} type="number" min={0} max={30} dir="ltr" className="w-20" value={notify.billLeadDays} onChange={(e) => void saveNotificationSettings({ billLeadDays: Math.max(0, Math.min(30, Number(e.target.value) || 0)) })} />}
                  {cls === "overspend" && <Input aria-label={t("notifications.thresholdPercent")} type="number" min={1} max={200} dir="ltr" className="w-20" value={notify.overspendThresholdBp / 100} onChange={(e) => void saveNotificationSettings({ overspendThresholdBp: Math.max(100, Math.min(20000, Math.round(Number(e.target.value) * 100) || 9000)) })} />}
                  {cls === "metalPrice" && <Input aria-label={t("notifications.movePercent")} type="number" min={0.1} max={50} step={0.1} dir="ltr" className="w-20" value={notify.metalMoveBp / 100} onChange={(e) => void saveNotificationSettings({ metalMoveBp: Math.max(10, Math.min(5000, Math.round(Number(e.target.value) * 100) || 200)) })} />}
                </ToggleRow>
              ))}
            </Section>
          )}

          {shown("s-data") && (
            <Section {...section("s-data", Database, "settings-data")}>
              <Note>{t("data.body")}</Note>
              <div className="flex flex-wrap gap-2.5">
                <Button variant="secondary" onClick={() => void model.exportData()}>{t("data.export")}</Button>
                {model.writes && (
                  <>
                    <Button variant="secondary" onClick={model.openImport}>{t("data.import")}</Button>
                    <Button variant="secondary" onClick={model.openCsvImport}>{t("csv.button")}</Button>
                  </>
                )}
              </div>
              <Note>{t("exports.body")}</Note>
              <div className="flex flex-col">
                {EXPORT_KINDS.map((kind) => (
                  <div key={kind} className="flex flex-wrap items-center gap-2 border-t border-border py-2 text-sm first:border-t-0">
                    <span className="min-w-0 flex-1">{t(`exports.${kind}`)}</span>
                    <Button size="sm" variant="outline" onClick={() => void model.exportTable(kind, "csv")}>CSV</Button>
                    <Button size="sm" variant="outline" onClick={() => void model.exportTable(kind, "xlsx")}>Excel</Button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section {...section("s-account", UserRound, "settings-account")}>
            {session?.deletionRequestedAt && (
              <p className="rounded-lg bg-warning-soft p-3 text-sm">
                {t("account.deletionPending", { date: formatWhen(new Date(session.deletionRequestedAt).getTime() + 30 * 86_400_000, model.language, DATE) })}
              </p>
            )}
            <div className="flex flex-wrap gap-2.5">
              <Button variant="secondary" asChild><Link to="/sync">{t("sync.title")}</Link></Button>
              <Button variant="secondary" asChild><Link to="/help">{t("help.title")}</Link></Button>
              <Button variant="secondary" onClick={model.replayTours}>{t("tours.replay")}</Button>
              <InstallButton variant="outline" />
              <Button variant="secondary" onClick={() => void model.signOut()}>{t("auth.logout")}</Button>
              {session?.deletionRequestedAt ? (
                <Button variant="ghost" onClick={model.cancelDeletion}>{t("account.cancelDeletion")}</Button>
              ) : (
                <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => model.setConfirmDelete(true)}>{t("account.delete")}</Button>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
