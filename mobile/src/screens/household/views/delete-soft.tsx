import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles } from "@/theme"
import type { DeleteScreenModel } from "../use-delete-screen"

/** Soft: what deleting means in a card edged in the warning colour, the password under it, then the one destructive button. */
export function DeleteSoft({ model }: { model: DeleteScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Card style={styles.warning}>
        <ThemedText variant="subhead">{t("household.deleteConfirm")}</ThemedText>
        <TextField testID="delete-household-password" label={t("auth.password")} secureTextEntry autoComplete="current-password" value={model.password} onChangeText={model.setPassword} />
      </Card>
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
      <Button testID="confirm-delete-household" variant="destructive" size="lg" title={t("household.delete")} loading={model.busy} disabled={!model.canConfirm} onPress={model.confirm} />
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  warning: { borderWidth: 1, borderColor: colors.destructive },
}))
