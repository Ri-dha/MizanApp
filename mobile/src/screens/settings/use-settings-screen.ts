import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocalSearchParams } from "expo-router"
import { Alert, type LayoutChangeEvent, type ScrollViewInstance } from "react-native"

import { cancelAccountDeletion, logout, requestAccountDeletion } from "@mizan/core/auth/session"
import { META_KEYS, readMeta, writeMeta } from "@mizan/core/db/meta"
import { NOTIFICATION_DEFAULTS, liveNotificationSetting, saveNotificationSettings } from "@mizan/core/db/notifications"
import { defaultsOf, livePrivacySetting } from "@mizan/core/db/privacy"
import { DEFAULT_LOCK_AFTER_SECONDS, biometricUnlock, clearLock, currentDataKey } from "@mizan/core/lock/store"
import { mayWriteRecords } from "@mizan/core/roles"
import { resetSyncState } from "@mizan/core/sync/engine"
import { regenerateRecoveryCode } from "@mizan/core/vault/account"
import { useAppMode } from "@/hooks/use-app-mode"
import { useLiveQuery, useLockState, useSession } from "@/hooks/use-core"
import { applyTheme, directionNeedsRestart, localeFor } from "@/platform/appearance"
import { disablePhonePush, enablePhonePush, phonePushState, sendTestPush, type PhonePushState } from "@/platform/push"
import { setPreferences, usePreferences, type LanguageChoice, type ThemeChoice } from "@/preferences"
import { forgetAllTours, useScreenTour } from "@/tours"
import { DATE, formatWhen } from "@/utils/dates"
import { describeError } from "@/utils/errors"

const ACCOUNT_GRACE_DAYS = 30
const DAY_MS = 86_400_000

/** Everything the Settings screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useSettingsScreen() {
  const { t, i18n } = useTranslation()
  useScreenTour("settings")
  const { section } = useLocalSearchParams<{ section?: string }>()
  const scrollRef = useRef<ScrollViewInstance>(null)
  const scrolledToSection = useRef(false)
  // Home's recovery reminder opens Settings at the code, which otherwise sits a few screens down.
  const showRecoverySection = (event: LayoutChangeEvent) => {
    if (section !== "recovery" || scrolledToSection.current) return
    scrolledToSection.current = true
    scrollRef.current?.scrollTo({ y: event.nativeEvent.layout.y, animated: true })
  }
  const session = useSession()
  // §4.2: an advisor has no records, Home or reminders; a viewer cannot write records.
  const advisor = session?.role === "ADVISOR"
  const restricted = advisor || session?.role === "DEPENDENT"
  const mode = useAppMode()
  const writes = mayWriteRecords(session?.role ?? "OWNER")
  const lockState = useLockState()
  const prefs = usePreferences()
  const privacy = useLiveQuery(async () => defaultsOf(await livePrivacySetting()), [], defaultsOf(undefined))
  const notify = useLiveQuery(async () => (await liveNotificationSetting()) ?? NOTIFICATION_DEFAULTS, [], NOTIFICATION_DEFAULTS)
  const [lockAfter, setLockAfter] = useState(DEFAULT_LOCK_AFTER_SECONDS)
  const [biometrics, setBiometrics] = useState<{ available: boolean; enrolled: boolean }>({ available: false, enrolled: false })
  const [message, setMessage] = useState<string | null>(null)
  const [push, setPush] = useState<PhonePushState>("unsupported")

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
  return {
    scrollRef,
    showRecoverySection,
    message, advisor, restricted, mode, writes, prefs, privacy, notify, push, biometrics, lockAfter,
    unlocked: lockState === "unlocked",
    householdBody: t("settings.householdBody", { name: session?.householdName ?? "", role: t(`household.roles.${session?.role ?? "OWNER"}`) }),
    chooseLanguage, chooseTheme,
    chooseLockAfter: (seconds: number) => { setLockAfter(seconds); void writeMeta(META_KEYS.lockAfterSeconds, seconds) },
    toggleBiometrics: (on: boolean) => void toggleBiometrics(on),
    regenerateRecovery: () => void run(regenerateRecoveryCode),
    togglePush: (on: boolean) => void togglePush(on),
    sendTest: () => void run(async () => setMessage(t("notifications.testSent", { count: await sendTestPush() }))),
    saveNotify: (patch: Parameters<typeof saveNotificationSettings>[0]) => void saveNotificationSettings(patch),
    replayTours: () => { forgetAllTours(); setMessage(t("tours.replayed")) },
    signOut: () => void signOut(),
    pendingDeletion: pendingDeletion !== null ? t("account.deletionPending", { date: formatWhen(pendingDeletion, i18n.language, DATE) }) : null,
    cancelDeletion: () => void run(cancelAccountDeletion, t("account.deletionCancelled")),
    deleteAccount: confirmDeleteAccount,
  }
}

export type SettingsScreenModel = ReturnType<typeof useSettingsScreen>
