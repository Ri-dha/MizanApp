import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ResetPasswordPageModel } from "../useResetPasswordPage"
import { AuthError, AuthHeading, AuthSplit, authInput, authLink, authSubmit } from "./parts"

export default function ResetPasswordSoft({ model }: { model: ResetPasswordPageModel }) {
  const { t } = useTranslation()
  return (
    <AuthSplit>
      <AuthHeading title={t("auth.resetTitle")} />
      <form onSubmit={model.submit} className="flex flex-col gap-4.5">
        <Field id="identifier" label={t("auth.identifier")}>
          <Input id="identifier" className={authInput} type="email" dir="ltr" autoComplete="email" value={model.identifier} onChange={(e) => model.setIdentifier(e.target.value)} required disabled={model.requested} />
        </Field>
        {model.requested && (
          <>
            <Field id="code" label={t("auth.resetCode")}>
              <Input id="code" className={authInput} inputMode="numeric" value={model.code} onChange={(e) => model.setCode(e.target.value)} required />
            </Field>
            <Field id="newPassword" label={t("auth.newPassword")}>
              <Input id="newPassword" className={authInput} type="password" autoComplete="new-password" value={model.newPassword} onChange={(e) => model.setNewPassword(e.target.value)} required minLength={8} />
            </Field>
          </>
        )}
        <AuthError>{model.error}</AuthError>
        <Button type="submit" className={authSubmit} disabled={model.busy}>{model.requested ? t("auth.newPassword") : t("auth.resetTitle")}</Button>
        <Link to="/login" className={`${authLink} text-sm`}>{t("auth.login")}</Link>
      </form>
    </AuthSplit>
  )
}
