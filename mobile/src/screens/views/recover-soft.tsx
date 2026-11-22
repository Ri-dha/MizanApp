import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, type } from "@/theme"
import type { RecoverScreenModel, StartOverModel } from "../use-recover-screen"
import { FrontIntro, LockTile } from "./front-parts"

/** Soft: a lock tile, the title and why, the code and one wide button, then the other ways out kept quiet below. */
export function RecoverSoft({ model }: { model: RecoverScreenModel }) {
  const { t } = useTranslation()
  return (
    <>
      <FrontIntro mark={<LockTile />} title={t("vault.recoverTitle")} body={t("vault.recoverBody")} />
      <TextField testID="recovery-input" label={t("vault.recoveryCode")} autoCapitalize="characters" autoCorrect={false} style={type.code} value={model.code} onChangeText={model.setCode} />
      {model.wrong ? <Notice tone="error" testID="recover-failed">{t("vault.recoverFailed")}</Notice> : null}
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
      <Button testID="recover" size="lg" title={t("vault.recover")} loading={model.busy} disabled={!model.canSubmit} onPress={model.submit} />
      <ThemedText variant="subhead">{t("vault.otherDevice")}</ThemedText>
      <Button testID="no-code" variant="ghost" title={t("vault.noCode")} onPress={model.startOver} />
      <Button variant="secondary" title={t("auth.logout")} onPress={model.signOut} />
    </>
  )
}

/** Soft: what will be lost in a card edged in the warning colour, the word to type, then the one destructive button. */
export function StartOverSoft({ model, onBack }: { model: StartOverModel; onBack: () => void }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <FrontIntro mark={<LockTile />} title={t("vault.startOverTitle")} body={t("vault.startOverBody")} />
      {model.loading ? (
        <ThemedText variant="subhead">{t("common.loading")}</ThemedText>
      ) : (
        <>
          <Card style={styles.warning}>
            <Notice tone="error" testID="start-over-preview">{model.losses}</Notice>
            <TextField testID="start-over-word" label={t("vault.startOverType", { word: model.word })} autoCapitalize="characters" autoCorrect={false} value={model.typed} onChangeText={model.setTyped} />
          </Card>
          <Button testID="start-over" variant="destructive" size="lg" title={t("vault.startOverConfirm")} loading={model.busy} disabled={!model.confirmed} onPress={model.confirm} />
        </>
      )}
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
      <Button variant="secondary" title={t("vault.startOverBack")} onPress={onBack} />
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  warning: { borderWidth: 1, borderColor: colors.destructive },
}))
