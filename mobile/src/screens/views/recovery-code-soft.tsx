import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { Card } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing, type } from "@/theme"
import type { RecoveryCodeScreenModel } from "../use-recovery-code-screen"
import { FrontIntro, LockTile } from "./front-parts"

/** Soft: a lock tile, the title and why, the code alone in a card so it can be read and selected, copy, then one wide button. */
export function RecoveryCodeSoft({ model }: { model: RecoveryCodeScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <FrontIntro mark={<LockTile />} title={t("vault.recoveryTitle")} body={t("vault.recoveryBody")} />
      <Card><ThemedText selectable testID="recovery-code" style={styles.code}>{model.code}</ThemedText></Card>
      <Button variant="secondary" title={t("vault.copy")} onPress={model.copy} />
      <Button testID="recovery-saved" size="lg" title={t("vault.recoverySaved")} onPress={model.saved} />
    </>
  )
}

const useStyles = makeStyles(() => ({
  code: { ...type.code, paddingVertical: spacing.sm, textAlign: "center" },
}))
