import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles } from "@/theme"
import type { LockScreenModel } from "../use-lock-screen"
import { FrontIntro, PinDots, ScaleMark } from "./front-parts"

const MAX_PIN = 8

/** Soft: the mark, the app's name and why it is locked, centred, with dots that fill as the PIN is typed. */
export function LockSoft({ model }: { model: LockScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <FrontIntro centred mark={<ScaleMark size={28} />} title={t("app.name")} body={t("lock.body")} />
      <PinDots entered={model.pin.length} total={Math.max(6, model.pin.length)} />
      <TextField testID="lock-pin" label={t("lock.enterPin")} keyboardType="number-pad" secureTextEntry maxLength={MAX_PIN} value={model.pin} onChangeText={model.setPin} onSubmitEditing={model.submit} autoFocus={!model.biometric} />
      {model.wrong ? <ThemedText testID="wrong-pin" style={styles.wrong}>{t("lock.wrongPin")}</ThemedText> : null}
      <Button testID="unlock-pin" size="lg" title={t("lock.unlock")} disabled={!model.canSubmit} onPress={model.submit} />
      {model.biometric ? <Button testID="unlock-biometric" variant="ghost" title={t("lock.biometric")} onPress={model.useBiometrics} /> : null}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  wrong: { color: colors.destructive },
}))
