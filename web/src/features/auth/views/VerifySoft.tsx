import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { CODE_LENGTH, type VerifyPageModel } from "../useVerifyPage"
import { AuthError, AuthHeading, authCard } from "./parts"

export default function VerifySoft({ model }: { model: VerifyPageModel }) {
  const { t } = useTranslation()
  return (
    <div className={`${authCard} mx-auto max-w-md`}>
      <AuthHeading title={t("auth.verifyTitle")} body={t("auth.verifyBody", { contact: model.contact })} />
      <div className="flex flex-col items-center gap-4" dir="ltr">
        <InputOTP maxLength={CODE_LENGTH} value={model.code} onChange={model.setCode} onComplete={model.confirm} disabled={model.busy}>
          <InputOTPGroup>
            {Array.from({ length: CODE_LENGTH }, (_, i) => <InputOTPSlot key={i} index={i} />)}
          </InputOTPGroup>
        </InputOTP>
        <AuthError>{model.error}</AuthError>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => void model.resend()}>{t("auth.resend")}</Button>
          <Button variant="outline" onClick={model.skip}>{t("auth.skipForNow")}</Button>
        </div>
      </div>
    </div>
  )
}
