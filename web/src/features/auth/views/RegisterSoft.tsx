import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { Field } from "@/components/Field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CountrySelect } from "@/features/currency/CountrySelect"
import { CurrencySelect } from "@/features/currency/CurrencySelect"
import { AppModeChoice } from "@/features/settings/AppModeChoice"
import { AppStyleChoice } from "@/features/settings/AppStyleChoice"
import type { RegisterPageModel } from "../useRegisterPage"
import { AuthColumn, AuthError, AuthHeading, authInput, authLink, authSubmit } from "./parts"

export default function RegisterSoft({ model }: { model: RegisterPageModel }) {
  const { t } = useTranslation()
  return (
    <AuthColumn>
      <AuthHeading title={t("auth.register")} body={t("app.tagline")} />
      <form onSubmit={model.submit} className="flex flex-col gap-4.5">
        <Field id="displayName" label={t("auth.displayName")}>
          <Input id="displayName" className={authInput} autoComplete="name" value={model.displayName} onChange={(e) => model.setDisplayName(e.target.value)} required maxLength={80} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="country" label={t("auth.country")}>
              <CountrySelect id="country" value={model.country} catalogue={model.catalogue} onChange={model.setCountry} />
            </Field>
            <Field id="currency" label={t("auth.baseCurrency")}>
              <CurrencySelect id="currency" value={model.currency} onChange={model.setCurrency} codes={model.catalogue?.currencies} />
            </Field>
          </div>
          <p className="text-xs opacity-70">{t("auth.baseCurrencyHint")}</p>
        </div>
        <Field id="identifier" label={t("auth.identifier")} hint={t("auth.identifierHint")}>
          <Input id="identifier" className={authInput} type="email" dir="ltr" autoComplete="email" value={model.identifier} onChange={(e) => model.setIdentifier(e.target.value)} required />
        </Field>
        <Field id="password" label={t("auth.password")}>
          <Input id="password" className={authInput} type="password" autoComplete="new-password" value={model.password} onChange={(e) => model.setPassword(e.target.value)} required minLength={8} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <Label>{t("appMode.label")}</Label>
          <AppModeChoice value={model.mode} onChange={model.setMode} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("appStyle.label")}</Label>
          <AppStyleChoice value={model.style} onChange={model.setStyle} />
        </div>
        <AuthError>{model.error}</AuthError>
        <Button type="submit" className={authSubmit} disabled={model.busy}>{t("auth.register")}</Button>
        <Link to="/login" className={`${authLink} text-center text-sm`}>{t("auth.haveAccount")} {t("auth.login")}</Link>
      </form>
    </AuthColumn>
  )
}
