import { Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, View } from "react-native"

import { cancelAccountDeletion, logout, requestAccountDeletion } from "@mizan/core/auth/session"
import { META_KEYS, readMeta, writeMeta } from "@mizan/core/db/meta"
import { NOTIFICATION_DEFAULTS, NOTIFICATION_SWITCHES, liveNotificationSetting, saveNotificationSettings } from "@mizan/core/db/notifications"
import { PRIVACY_KINDS, defaultsOf, livePrivacySetting, savePrivacyDefault } from "@mizan/core/db/privacy"
import { mayWriteRecords } from "@mizan/core/roles"
import { DEFAULT_LOCK_AFTER_SECONDS, biometricUnlock, clearLock, currentDataKey, lock, removePin } from "@mizan/core/lock/store"
import { resetSyncState } from "@mizan/core/sync/engine"
import { regenerateRecoveryCode } from "@mizan/core/vault/account"
import type { DigitStyle } from "@mizan/core/domain/money/format"
import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { LinkRow } from "@/components/link-row"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Screen } from "@/components/screen"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { useLiveQuery, useLockState, useSession } from "@/hooks/use-core"
import { SUPPORTED_LOCALES, applyTheme, directionNeedsRestart, localeFor } from "@/platform/appearance"
import { disablePhonePush, enablePhonePush, phonePushState, sendTestPush, type PhonePushState } from "@/platform/push"
import { setPreferences, usePreferences, type LanguageChoice, type ThemeChoice } from "@/preferences"
import { spacing } from "@/theme"
import { describeError } from "@/utils/errors"
import { forgetAllTours, useScreenTour } from "@/tours"

const LOCK_CHOICES = [0, 30, 60, 300]
const THEMES: ThemeChoice[] = ["system", "light", "dark"]
const LANGUAGES: LanguageChoice[] = ["system", ...SUPPORTED_LOCALES]
const LANGUAGE_NAMES: Record<string, string> = { en: "English", ar: "العربية" }
const DIGITS: DigitStyle[] = ["western", "eastern"]
const ACCOUNT_GRACE_DAYS = 30
const DAY_MS = 86_400_000
const MAX_LEAD_DAYS = 30
const PERCENT_BP = 100

function Section({ title, body, children }: { title: string; body?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText variant="headline">{title}</ThemedText>
      {body ? <ThemedText variant="caption">{body}</ThemedText> : null}
      {children}
    </View>
  )
}

function ChoiceRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <Row last={last}>
      <View style={styles.field}>
        <ThemedText variant="caption">{label}</ThemedText>
        {children}
      </View>
    </Row>
  )
}

export function Settings() {
  const { t, i18n } = useTranslation()
  useScreenTour("settings")
  const session = useSession()
  // §4.2: an advisor has no records, Home or reminders; a viewer cannot write records.
  const advisor = session?.role === "ADVISOR"
  const writes = mayWriteRecords(session?.role ?? "OWNER")
  const lockState = useLockState()
  const prefs = usePreferences()
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const notify = useLiveQuery(async () => (await liveNotificationSetting()) ?? NOTIFICATION_DEFAULTS, [], NOTIFICATION_DEFAULTS)
  const [lockAfter, setLockAfter] = useState(DEFAULT_LOCK_AFTER_SECONDS)
  const [biometrics, setBiometrics] = useState<{ available: boolean; enrolled: boolean }>({ available: false, enrolled: false })
  const [message, setMessage] = useState<string | null>(null)
  const [push, setPush] = useState<PhonePushState>("unsupported")
  const date = (ms: number) => new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-IQ-u-nu-latn" : "en-GB", { dateStyle: "medium" }).format(new Date(ms))

  useEffect(() => {
    void readMeta<number>(META_KEYS.lockAfterSeconds).then((value) => value !== undefined && setLockAfter(value))
    void Promise.all([biometricUnlock().available(), biometricUnlock().enrolled()]).then(([available, enrolled]) => setBiometrics({ available, enrolled }))
    void phonePushState().then(setPush)
  }, [])

  async function run(action: () => Promise<unknown>, done?: string) {
    try {
      await action()
      if (done) setMessage(done)
    } catch (e) {
      setMessage(describeError(e))
    }
  }

  async function togglePush(on: boolean) {
    try {
      setPush(on ? await enablePhonePush() : await disablePhonePush())
    } catch (e) {
      setMessage(describeError(e))
    }
  }

  function chooseLanguage(choice: LanguageChoice) {
    setPreferences({ language: choice })
    const locale = localeFor(choice)
    void i18n.changeLanguage(locale)
    if (directionNeedsRestart(locale)) setMessage(t("settings.restartForDirection"))
  }

  function chooseTheme(choice: ThemeChoice) {
    setPreferences({ theme: choice })
    applyTheme(choice)
  }

  async function toggleBiometrics(on: boolean) {
    if (!on) {
      await biometricUnlock().remove()
      setBiometrics({ ...biometrics, enrolled: false })
      setMessage(t("lock.biometricsRemoved"))
      return
    }
    const key = currentDataKey()
    if (!key) return
    const enrolled = await biometricUnlock().enrol(key)
    setBiometrics({ ...biometrics, enrolled })
    setMessage(enrolled ? t("lock.biometricsEnabled") : t("lock.biometricsUnsupported"))
  }

  function confirmDeleteAccount() {
    Alert.alert(t("account.delete"), t("account.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("account.confirmDelete"), style: "destructive", onPress: () => void run(requestAccountDeletion, t("account.deletionRequested")) },
    ])
  }

  async function signOut() {
    await clearLock()
    await resetSyncState()
    await logout()
  }

  const pendingDeletion = session?.deletionRequestedAt ? new Date(session.deletionRequestedAt).getTime() + ACCOUNT_GRACE_DAYS * DAY_MS : null
  return (
    <Screen>
      <Stack.Screen options={{ title: t("settings.title") }} />
      {message ? <Notice>{message}</Notice> : null}

      <Section title={`${t("settings.language")} · ${t("settings.theme")}`}>
        <Group>
          <ChoiceRow label={t("settings.language")}>
            <Chips testID="settings-language" options={LANGUAGES.map((l) => ({ value: l, label: l === "system" ? t("settings.languageSystem") : LANGUAGE_NAMES[l] }))} value={prefs.language} onChange={(v) => v && chooseLanguage(v as LanguageChoice)} />
          </ChoiceRow>
          <ChoiceRow label={t("settings.theme")} last>
            <Chips testID="settings-theme" options={THEMES.map((th) => ({ value: th, label: t(`settings.themes.${th}`) }))} value={prefs.theme} onChange={(v) => v && chooseTheme(v as ThemeChoice)} />
          </ChoiceRow>
        </Group>
      </Section>

      {!advisor ? (
        <Section title={t("homeLayout.title")}>
          <Group>
            <LinkRow testID="settings-home-layout" href="/home-layout" last>
              <ThemedText>{t("homeLayout.customise")}</ThemedText>
              <ThemedText variant="caption" numberOfLines={2}>{t("homeLayout.body")}</ThemedText>
            </LinkRow>
          </Group>
        </Section>
      ) : null}

      <Section title={t("settings.security")}>
        <Group>
          <ChoiceRow label={t("settings.lockAfter")} last={!biometrics.available}>
            <Chips
              testID="settings-lock-after"
              options={LOCK_CHOICES.map((s) => ({ value: String(s), label: t("settings.seconds", { count: s }) }))}
              value={String(lockAfter)}
              onChange={(v) => { if (!v) return; setLockAfter(Number(v)); void writeMeta(META_KEYS.lockAfterSeconds, Number(v)) }}
            />
          </ChoiceRow>
          {biometrics.available ? (
            <Row last><ToggleRow testID="settings-biometrics" label={t("lock.biometricsSwitch")} value={biometrics.enrolled} onChange={(on) => void toggleBiometrics(on)} /></Row>
          ) : null}
        </Group>
        <View style={styles.buttons}>
          <Button testID="settings-lock-now" variant="secondary" title={t("lock.lockNow")} disabled={lockState !== "unlocked"} onPress={lock} />
          <Button testID="settings-remove-pin" variant="secondary" title={t("lock.remove")} onPress={() => void removePin()} />
        </View>
      </Section>

      <Section title={t("vault.settingsTitle")} body={t("vault.settingsBody")}>
        <Button testID="settings-recovery" variant="secondary" title={t("vault.regenerate")} onPress={() => void run(regenerateRecoveryCode)} />
      </Section>

      <Section title={t("settings.household")} body={t("settings.householdBody", { name: session?.householdName ?? "", role: t(`household.roles.${session?.role ?? "OWNER"}`) })}>
        <Group><LinkRow href="/household" last><ThemedText>{t("household.manage")}</ThemedText></LinkRow></Group>
      </Section>

      {writes ? (
        <Section title={t("privacy.title")} body={t("privacy.body")}>
          <Group>
            {PRIVACY_KINDS.map((kind, index) => (
              <Row key={kind} last={index === PRIVACY_KINDS.length - 1}>
                <ToggleRow testID={`privacy-${kind}`} label={t(`privacy.kinds.${kind}`)} value={privacy[kind] === "PRIVATE"} onChange={(on) => void savePrivacyDefault(kind, on ? "PRIVATE" : "SHARED")} />
              </Row>
            ))}
          </Group>
        </Section>
      ) : null}

      <Section title={t("settings.display")}>
        <Group>
          <ChoiceRow label={t("settings.digits")}>
            <Chips testID="settings-digits" options={DIGITS.map((d) => ({ value: d, label: t(`settings.digitStyles.${d}`) }))} value={prefs.digitStyle} onChange={(v) => v && setPreferences({ digitStyle: v as DigitStyle })} />
            <ThemedText variant="caption">{t("settings.digitsHint")}</ThemedText>
          </ChoiceRow>
          <Row><ToggleRow testID="settings-hijri" label={t("settings.showHijri")} value={prefs.showHijri} onChange={(on) => setPreferences({ showHijri: on })} /></Row>
          <Row><ToggleRow testID="settings-usd" label={t("settings.showUsd")} value={prefs.showUsd} onChange={(on) => setPreferences({ showUsd: on })} /></Row>
          <Row last>
            <TextField
              testID="settings-valuation-months"
              label={t("settings.valuationReminder")}
              keyboardType="number-pad"
              maxLength={2}
              value={String(prefs.valuationReminderMonths)}
              onChangeText={(v) => setPreferences({ valuationReminderMonths: Math.max(1, Number(v) || 1) })}
            />
          </Row>
        </Group>
      </Section>

      {!advisor ? (
        <Section title={t("settings.notifications")} body={t("settings.notificationsBody")}>
          {push === "needs-setup" ? <ThemedText variant="caption">{t("notifications.phoneNeedsSetup")}</ThemedText> : null}
          {push === "denied" ? <ThemedText variant="caption">{t("notifications.phoneDenied")}</ThemedText> : null}
          {push === "on" || push === "off" ? (
            <Group>
              <Row last={push === "off"}><ToggleRow testID="notify-phone" label={t("notifications.onThisDevice")} value={push === "on"} onChange={(on) => void togglePush(on)} /></Row>
              {push === "on" ? (
                <Row last><Button testID="notify-test" variant="ghost" title={t("notifications.sendTest")} style={styles.start} onPress={() => void run(async () => setMessage(t("notifications.testSent", { count: await sendTestPush() })))} /></Row>
            ) : null}
          </Group>
        ) : null}
        <Group>
          <Row><ToggleRow testID="notify-quiet" label={t("settings.quietMode")} value={notify.quietMode} onChange={(on) => void saveNotificationSettings({ quietMode: on })} /></Row>
          {NOTIFICATION_SWITCHES.map((cls, index) => (
            <Row key={cls} last={index === NOTIFICATION_SWITCHES.length - 1}>
              <ToggleRow testID={`notify-${cls}`} label={t(`settings.notificationClasses.${cls}`)} value={notify[cls] && !notify.quietMode} onChange={(on) => !notify.quietMode && void saveNotificationSettings({ [cls]: on })} />
              {cls === "billDue" && notify[cls] && !notify.quietMode ? (
                <TextField label={t("notifications.leadDays")} keyboardType="number-pad" maxLength={2} value={String(notify.billLeadDays)}
                  onChangeText={(v) => void saveNotificationSettings({ billLeadDays: Math.max(0, Math.min(MAX_LEAD_DAYS, Number(v) || 0)) })} />
              ) : null}
              {cls === "overspend" && notify[cls] && !notify.quietMode ? (
                <TextField label={t("notifications.thresholdPercent")} keyboardType="number-pad" maxLength={3} value={String(notify.overspendThresholdBp / PERCENT_BP)}
                  onChangeText={(v) => void saveNotificationSettings({ overspendThresholdBp: Math.max(100, Math.min(20000, Math.round(Number(v) * PERCENT_BP) || 9000)) })} />
              ) : null}
              {cls === "metalPrice" && notify[cls] && !notify.quietMode ? (
                <TextField label={t("notifications.movePercent")} keyboardType="decimal-pad" maxLength={4} value={String(notify.metalMoveBp / PERCENT_BP)}
                  onChangeText={(v) => void saveNotificationSettings({ metalMoveBp: Math.max(10, Math.min(5000, Math.round(Number(v) * PERCENT_BP) || 200)) })} />
              ) : null}
            </Row>
          ))}
        </Group>
      </Section>
      ) : null}

      {!advisor ? (
        <Section title={t("backup.title")}>
          <Group><LinkRow testID="settings-backup" href="/backup" last><ThemedText>{t("backup.title")}</ThemedText><ThemedText variant="caption" numberOfLines={2}>{t("backup.body")}</ThemedText></LinkRow></Group>
        </Section>
      ) : null}

      {!advisor ? (
        <Section title={t("data.title")}>
          <Group><LinkRow testID="settings-data" href="/data" last><ThemedText>{t("data.title")}</ThemedText><ThemedText variant="caption" numberOfLines={2}>{t("data.body")}</ThemedText></LinkRow></Group>
        </Section>
      ) : null}

      <Section title={t("settings.account")}>
        {pendingDeletion !== null ? <Notice tone="error">{t("account.deletionPending", { date: date(pendingDeletion) })}</Notice> : null}
        <View style={styles.buttons}>
          <Button testID="settings-replay-tours" variant="secondary" title={t("tours.replay")} onPress={() => { forgetAllTours(); setMessage(t("tours.replayed")) }} />
          <Button testID="settings-sign-out" variant="secondary" title={t("auth.logout")} onPress={() => void signOut()} />
          {pendingDeletion !== null
            ? <Button testID="settings-cancel-deletion" variant="secondary" title={t("account.cancelDeletion")} onPress={() => void run(cancelAccountDeletion, t("account.deletionCancelled"))} />
            : <Button testID="settings-delete-account" variant="destructive" title={t("account.delete")} onPress={confirmDeleteAccount} />}
        </View>
      </Section>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  field: { gap: spacing.xs },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  start: { alignSelf: "flex-start" },
})
