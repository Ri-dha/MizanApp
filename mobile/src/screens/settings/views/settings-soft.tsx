import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { NOTIFICATION_SWITCHES } from "@mizan/core/db/notifications"
import { PRIVACY_KINDS, savePrivacyDefault } from "@mizan/core/db/privacy"
import type { DigitStyle } from "@mizan/core/domain/money/format"
import { lock, removePin } from "@mizan/core/lock/store"
import { AppModeChoice } from "@/components/app-mode-choice"
import { AppStyleChoice } from "@/components/app-style-choice"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { LinkRow } from "@/components/link-row"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Section } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { SUPPORTED_LOCALES } from "@/platform/appearance"
import { setPreferences, type LanguageChoice, type ThemeChoice } from "@/preferences"
import { makeStyles, spacing } from "@/theme"
import { CurrencySettings } from "../currency"
import type { SettingsScreenModel } from "../use-settings-screen"

const LOCK_CHOICES = [0, 30, 60, 300]
const THEMES: ThemeChoice[] = ["system", "light", "dark"]
const LANGUAGES: LanguageChoice[] = ["system", ...SUPPORTED_LOCALES]
const LANGUAGE_NAMES: Record<string, string> = { en: "English", ar: "العربية" }
const DIGITS: DigitStyle[] = ["western", "eastern"]
const MAX_LEAD_DAYS = 30
const PERCENT_BP = 100

/** Soft: appearance and the template first, then security, the household, display, reminders, data and the account, each a titled group. */
export function SettingsSoft({ model }: { model: SettingsScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const { prefs, notify, push, biometrics } = model

  function ChoiceRow({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) {
    return (
      <Row last={last}>
        <View style={styles.field}>
          <ThemedText variant="caption">{label}</ThemedText>
          {children}
        </View>
      </Row>
    )
  }

  return (
    <>
      {model.message ? <Notice>{model.message}</Notice> : null}

      <Section title={`${t("settings.language")} · ${t("settings.theme")}`}>
        <Group>
          {ChoiceRow({
            label: t("settings.language"),
            children: <Chips testID="settings-language" options={LANGUAGES.map((l) => ({ value: l, label: l === "system" ? t("settings.languageSystem") : LANGUAGE_NAMES[l] }))} value={prefs.language} onChange={(v) => v && model.chooseLanguage(v as LanguageChoice)} />,
          })}
          {ChoiceRow({
            label: t("settings.theme"), last: true,
            children: <Chips testID="settings-theme" options={THEMES.map((th) => ({ value: th, label: t(`settings.themes.${th}`) }))} value={prefs.theme} onChange={(v) => v && model.chooseTheme(v as ThemeChoice)} />,
          })}
        </Group>
      </Section>

      <Section title={t("appStyle.title")} note={t("appStyle.body")}>
        <AppStyleChoice value={prefs.appStyle} onChange={(next) => setPreferences({ appStyle: next })} />
      </Section>

      {model.restricted ? null : (
        <Section title={t("appMode.title")} note={t("appMode.body")}>
          <AppModeChoice value={model.mode} onChange={(next) => setPreferences({ appMode: next })} />
        </Section>
      )}

      {model.advisor ? null : (
        <Section title={t("homeLayout.title")}>
          <Group>
            <LinkRow testID="settings-home-layout" href="/home-layout" last>
              <ThemedText>{t("homeLayout.customise")}</ThemedText>
              <ThemedText variant="caption" numberOfLines={2}>{t("homeLayout.body")}</ThemedText>
            </LinkRow>
          </Group>
        </Section>
      )}

      <Section title={t("settings.security")}>
        <Group>
          {ChoiceRow({
            label: t("settings.lockAfter"), last: !biometrics.available,
            children: <Chips testID="settings-lock-after" options={LOCK_CHOICES.map((s) => ({ value: String(s), label: t("settings.seconds", { count: s }) }))} value={String(model.lockAfter)} onChange={(v) => { if (v) model.chooseLockAfter(Number(v)) }} />,
          })}
          {biometrics.available ? <Row last><ToggleRow testID="settings-biometrics" label={t("lock.biometricsSwitch")} value={biometrics.enrolled} onChange={model.toggleBiometrics} /></Row> : null}
        </Group>
        <View style={styles.buttons}>
          <Button testID="settings-lock-now" variant="secondary" title={t("lock.lockNow")} disabled={!model.unlocked} onPress={lock} />
          <Button testID="settings-remove-pin" variant="secondary" title={t("lock.remove")} onPress={() => void removePin()} />
        </View>
      </Section>

      <Section title={t("vault.settingsTitle")} note={t("vault.settingsBody")}>
        <Button testID="settings-recovery" variant="secondary" title={t("vault.regenerate")} onPress={model.regenerateRecovery} />
      </Section>

      <Section title={t("currency.title")} note={t("currency.body")}>
        <CurrencySettings />
      </Section>

      {model.mode === "advanced" ? (
        <Section title={t("settings.household")} note={model.householdBody}>
          <Group><LinkRow href="/household" last><ThemedText>{t("household.manage")}</ThemedText></LinkRow></Group>
        </Section>
      ) : null}

      {model.writes && model.mode === "advanced" ? (
        <Section title={t("privacy.title")} note={t("privacy.body")}>
          <Group>
            {PRIVACY_KINDS.map((kind, index) => (
              <Row key={kind} last={index === PRIVACY_KINDS.length - 1}>
                <ToggleRow testID={`privacy-${kind}`} label={t(`privacy.kinds.${kind}`)} value={model.privacy[kind] === "PRIVATE"} onChange={(on) => void savePrivacyDefault(kind, on ? "PRIVATE" : "SHARED")} />
              </Row>
            ))}
          </Group>
        </Section>
      ) : null}

      <Section title={t("settings.display")} note={t("settings.followsYou")}>
        <Group>
          {ChoiceRow({
            label: t("settings.digits"),
            children: (
              <>
                <Chips testID="settings-digits" options={DIGITS.map((d) => ({ value: d, label: t(`settings.digitStyles.${d}`) }))} value={prefs.digitStyle} onChange={(v) => v && setPreferences({ digitStyle: v as DigitStyle })} />
                <ThemedText variant="caption">{t("settings.digitsHint")}</ThemedText>
              </>
            ),
          })}
          <Row><ToggleRow testID="settings-hijri" label={t("settings.showHijri")} value={prefs.showHijri} onChange={(on) => setPreferences({ showHijri: on })} /></Row>
          <Row><ToggleRow testID="settings-usd" label={t("settings.showUsd")} value={prefs.showUsd} onChange={(on) => setPreferences({ showUsd: on })} /></Row>
          <Row last>
            <TextField testID="settings-valuation-months" label={t("settings.valuationReminder")} keyboardType="number-pad" maxLength={2} value={String(prefs.valuationReminderMonths)} onChangeText={(v) => setPreferences({ valuationReminderMonths: Math.max(1, Number(v) || 1) })} />
          </Row>
        </Group>
      </Section>

      {model.advisor ? null : (
        <Section title={t("settings.notifications")} note={t("settings.notificationsBody")}>
          {push === "needs-setup" ? <ThemedText variant="caption">{t("notifications.phoneNeedsSetup")}</ThemedText> : null}
          {push === "denied" ? <ThemedText variant="caption">{t("notifications.phoneDenied")}</ThemedText> : null}
          {push === "on" || push === "off" ? (
            <Group>
              <Row last={push === "off"}><ToggleRow testID="notify-phone" label={t("notifications.onThisDevice")} value={push === "on"} onChange={model.togglePush} /></Row>
              {push === "on" ? <Row last><Button testID="notify-test" variant="ghost" title={t("notifications.sendTest")} style={styles.start} onPress={model.sendTest} /></Row> : null}
            </Group>
          ) : null}
          <Group>
            <Row><ToggleRow testID="notify-quiet" label={t("settings.quietMode")} value={notify.quietMode} onChange={(on) => model.saveNotify({ quietMode: on })} /></Row>
            {NOTIFICATION_SWITCHES.map((cls, index) => {
              const on = notify[cls] && !notify.quietMode
              return (
                <Row key={cls} last={index === NOTIFICATION_SWITCHES.length - 1}>
                  <ToggleRow testID={`notify-${cls}`} label={t(`settings.notificationClasses.${cls}`)} value={on} onChange={(next) => { if (!notify.quietMode) model.saveNotify({ [cls]: next }) }} />
                  {cls === "billDue" && on ? (
                    <TextField label={t("notifications.leadDays")} keyboardType="number-pad" maxLength={2} value={String(notify.billLeadDays)}
                      onChangeText={(v) => model.saveNotify({ billLeadDays: Math.max(0, Math.min(MAX_LEAD_DAYS, Number(v) || 0)) })} />
                  ) : null}
                  {cls === "overspend" && on ? (
                    <TextField label={t("notifications.thresholdPercent")} keyboardType="number-pad" maxLength={3} value={String(notify.overspendThresholdBp / PERCENT_BP)}
                      onChangeText={(v) => model.saveNotify({ overspendThresholdBp: Math.max(100, Math.min(20000, Math.round(Number(v) * PERCENT_BP) || 9000)) })} />
                  ) : null}
                  {cls === "metalPrice" && on ? (
                    <TextField label={t("notifications.movePercent")} keyboardType="decimal-pad" maxLength={4} value={String(notify.metalMoveBp / PERCENT_BP)}
                      onChangeText={(v) => model.saveNotify({ metalMoveBp: Math.max(10, Math.min(5000, Math.round(Number(v) * PERCENT_BP) || 200)) })} />
                  ) : null}
                </Row>
              )
            })}
          </Group>
        </Section>
      )}

      {model.advisor ? null : (
        <Section title={`${t("backup.title")} · ${t("data.title")}`}>
          <Group>
            <LinkRow testID="settings-backup" href="/backup"><ThemedText>{t("backup.title")}</ThemedText><ThemedText variant="caption" numberOfLines={2}>{t("backup.body")}</ThemedText></LinkRow>
            <LinkRow testID="settings-data" href="/data" last><ThemedText>{t("data.title")}</ThemedText><ThemedText variant="caption" numberOfLines={2}>{t("data.body")}</ThemedText></LinkRow>
          </Group>
        </Section>
      )}

      <Section title={t("settings.account")}>
        {model.pendingDeletion ? <Notice tone="error">{model.pendingDeletion}</Notice> : null}
        <View style={styles.buttons}>
          <Button testID="settings-replay-tours" variant="secondary" title={t("tours.replay")} onPress={model.replayTours} />
          <Button testID="settings-sign-out" variant="secondary" title={t("auth.logout")} onPress={model.signOut} />
          {model.pendingDeletion
            ? <Button testID="settings-cancel-deletion" variant="secondary" title={t("account.cancelDeletion")} onPress={model.cancelDeletion} />
            : <Button testID="settings-delete-account" variant="destructive" title={t("account.delete")} onPress={model.deleteAccount} />}
        </View>
      </Section>
    </>
  )
}

const useStyles = makeStyles(() => ({
  field: { gap: spacing.xs },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  start: { alignSelf: "flex-start" },
}))
