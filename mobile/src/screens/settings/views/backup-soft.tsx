import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Card, Section } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import type { BackupScreenModel } from "../use-backup-screen"

/** Soft: what a backup is, a card with the switch, the last copy and its actions (or the passphrase form in its place), then the copies kept. */
export function BackupSoft({ model }: { model: BackupScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      {model.message ? <Notice>{model.message}</Notice> : null}
      <ThemedText variant="subhead">{t("backup.body")}</ThemedText>

      {model.asking ? (
        <Card>
          <ThemedText variant="headline">{model.asking === "set" ? t("backup.setPassphrase") : t("backup.restore")}</ThemedText>
          <ThemedText variant="caption">{model.asking === "set" ? t("backup.passphraseHint") : t("backup.restoreHint")}</ThemedText>
          <TextField testID="backup-passphrase" label={t("backup.passphrase")} secureTextEntry autoComplete="off" autoCapitalize="none" value={model.passphrase} onChangeText={model.setPassphrase} autoFocus />
          <View style={styles.buttons}>
            <Button variant="secondary" title={t("common.cancel")} onPress={model.cancel} />
            <Button testID="backup-submit" title={model.asking === "set" ? t("accounts.save") : t("backup.open")} loading={model.busy} disabled={!model.canSubmit} onPress={model.submit} />
          </View>
        </Card>
      ) : !model.configured ? (
        <Button testID="backup-set" size="lg" title={t("backup.setPassphrase")} onPress={model.askSet} />
      ) : (
        <Card>
          <ToggleRow testID="backup-auto" label={t("backup.automatic")} value={model.automatic} onChange={model.setAutomatic} />
          <ThemedText variant="caption">{model.lastLine}</ThemedText>
          <View style={styles.buttons}>
            <Button testID="backup-now" variant="secondary" title={t("backup.now")} onPress={model.backUpNow} />
            <Button testID="backup-change" variant="secondary" title={t("backup.changePassphrase")} onPress={model.askSet} />
            <Button testID="backup-forget" variant="ghost" title={t("backup.forget")} onPress={model.forget} />
          </View>
        </Card>
      )}

      {model.backups.length > 0 ? (
        <Section title={t("backup.list")}>
          <Group>
            {model.backups.map((backup, index) => (
              <Row key={backup.id} last={index === model.backups.length - 1} trailing={<Button testID={`restore-${backup.id}`} variant="ghost" title={t("backup.restore")} onPress={backup.restore} />}>
                <ThemedText>{backup.when}</ThemedText>
                <ThemedText variant="caption">{backup.size}</ThemedText>
              </Row>
            ))}
          </Group>
        </Section>
      ) : null}
    </>
  )
}

const useStyles = makeStyles(() => ({
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
}))
