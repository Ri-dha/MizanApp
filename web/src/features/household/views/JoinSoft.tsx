import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { AuthColumn, AuthHeading, authLink } from "@/features/auth/views/parts"
import type { JoinPageModel } from "../useJoinPage"

export default function JoinSoft({ model }: { model: JoinPageModel }) {
  const { t } = useTranslation()
  const { preview } = model
  return (
    <AuthColumn>
      <AuthHeading title={t("household.joinTitle")} body={t("app.tagline")} />
      {model.error && <p className="text-destructive">{model.error}</p>}
      {preview && (
        <>
          <p>{t("household.joinBody", { household: preview.householdName, by: preview.invitedBy, role: t(`household.roles.${preview.role}`) })}</p>
          <p className="text-sm text-muted-foreground">{t("household.expires", { date: model.date(preview.expiresAt) })}</p>
          {model.signedIn ? (
            <Button className="h-10" onClick={() => void model.join()} disabled={model.busy}>{t("household.join")}</Button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm">{t("household.joinSignIn")}</p>
              <Button asChild className="h-10" onClick={model.remember}><Link to="/login">{t("auth.login")}</Link></Button>
              <Button asChild className="h-10" variant="outline" onClick={model.remember}><Link to="/register">{t("auth.register")}</Link></Button>
            </div>
          )}
        </>
      )}
      <Link to="/" className={`${authLink} text-sm`}>{t("household.backHome")}</Link>
    </AuthColumn>
  )
}
