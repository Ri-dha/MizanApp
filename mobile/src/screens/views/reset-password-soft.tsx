import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { TextField } from "@/components/text-field"
import type { ResetPasswordScreenModel } from "../use-reset-password-screen"
import { ScaleMark } from "./front-parts"

/** Soft: the mark as on sign-in (the header carries the title), the contact, then the code and new password once a code is on its way. */
export function ResetPasswordSoft({ model }: { model: ResetPasswordScreenModel }) {
  const { t } = useTranslation()
  if (model.done) {
    return (
      <>
        <ScaleMark />
        <Notice testID="reset-done">{t("auth.resetDone")}</Notice>
        <Button size="lg" title={t("auth.login")} onPress={model.back} />
      </>
    )
  }
  return (
    <>
      <ScaleMark />
      <TextField testID="reset-identifier" label={t("auth.identifier")} autoCapitalize="none" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" editable={!model.requested} value={model.identifier} onChangeText={model.setIdentifier} />
      {model.requested ? (
        <>
          <Notice>{t("auth.resetRequested")}</Notice>
          <TextField testID="reset-code" label={t("auth.resetCode")} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" value={model.code} onChangeText={model.setCode} />
          <TextField testID="reset-new-password" label={t("auth.newPassword")} secureTextEntry autoComplete="new-password" value={model.newPassword} onChangeText={model.setNewPassword} />
        </>
      ) : null}
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
      <Button testID="reset-submit" size="lg" title={model.requested ? t("auth.newPassword") : t("auth.resetTitle")} loading={model.busy} disabled={!model.canSubmit} onPress={model.submit} />
    </>
  )
}
