import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { CODE_LENGTH, type VerifyScreenModel } from "../use-verify-screen"
import { PinDots, ScaleMark } from "./front-parts"

/** Soft: the mark and where the code went (the header already carries the title), dots that fill as it is typed, the field, then a quiet resend. */
export function VerifySoft({ model }: { model: VerifyScreenModel }) {
  const { t } = useTranslation()
  return (
    <>
      <ScaleMark />
      <ThemedText variant="subhead">{t("auth.verifyBody", { contact: model.contact })}</ThemedText>
      <PinDots entered={model.code.length} total={CODE_LENGTH} />
      <TextField testID="verify-code" label={t("auth.verify")} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={CODE_LENGTH} editable={!model.busy} value={model.code} onChangeText={model.typed} autoFocus />
      {model.error ? <Notice tone="error" testID="verify-error">{model.error}</Notice> : null}
      {model.sent ? <Notice>{t("auth.codeSent")}</Notice> : null}
      <Button testID="resend-code" variant="secondary" title={t("auth.resend")} onPress={model.resend} />
    </>
  )
}
