import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles } from "@/theme"
import type { UnlockScreenModel } from "../use-unlock-screen"
import { FrontIntro, LockTile } from "./front-parts"

/** Soft: the same opening block as Set a PIN, then the password and one wide button. */
export function UnlockSoft({ model }: { model: UnlockScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <FrontIntro mark={<LockTile />} title={t("vault.unlockTitle")} />
      <TextField testID="unlock-password" label={t("auth.password")} secureTextEntry value={model.password} onChangeText={model.setPassword} onSubmitEditing={model.submit} />
      {model.failed ? <ThemedText style={styles.failed}>{t("common.error")}</ThemedText> : null}
      <Button testID="unlock" title={t("vault.unlock")} size="lg" loading={model.busy} disabled={!model.password} onPress={model.submit} />
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  failed: { color: colors.destructive },
}))
