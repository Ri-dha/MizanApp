import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LoginPageModel } from "../useLoginPage"
import { AuthError, AuthHeading, AuthSplit, authInput, authLink, authSubmit } from "./parts"

export default function LoginSoft({ model }: { model: LoginPageModel }) {
  const { t } = useTranslation()
  return (
    <AuthSplit>
      <AuthHeading title={t("auth.login")} body={t("auth.welcomeBack")} />
      <form onSubmit={model.submit} className="flex flex-col gap-4.5">
        <Field id="identifier" label={t("auth.identifier")}>
          <Input id="identifier" className={authInput} type="email" dir="ltr" autoComplete="email" value={model.identifier} onChange={(e) => model.setIdentifier(e.target.value)} required />
        </Field>
        <Field id="password" label={t("auth.password")}>
          <Input id="password" className={authInput} type="password" autoComplete="current-password" value={model.password} onChange={(e) => model.setPassword(e.target.value)} required />
        </Field>
        <AuthError>{model.error}</AuthError>
        <AuthError>{model.offline && t("auth.offlineNeedsSession")}</AuthError>
        <Button type="submit" className={authSubmit} disabled={model.busy}>{t("auth.login")}</Button>
        <div className="flex flex-wrap justify-between gap-3 text-sm">
          <Link to="/register" className={authLink}>{t("auth.noAccount")} {t("auth.register")}</Link>
          <Link to="/reset" className={authLink}>{t("auth.forgot")}</Link>
        </div>
      </form>
    </AuthSplit>
  )
}
