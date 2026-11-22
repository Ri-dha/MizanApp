import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Chips } from "@/components/chips"
import { Notice } from "@/components/notice"
import { Banner, Card } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import { ImagesField } from "../images"
import { MAX_BODY } from "../use-thread-screen"
import type { NewScreenModel } from "../use-new-screen"

const MAX_SUBJECT = 120

/** Soft: the privacy line as a banner, the kind and the words in one card, the pictures in a second, then one wide button. */
export function NewSoft({ model }: { model: NewScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <Banner>{t("support.privacy")}</Banner>
      <Card>
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("support.categoryLabel")}</ThemedText>
          <Chips testID="report-category" options={model.categories} value={model.category} onChange={model.setCategory} />
        </View>
        <TextField testID="report-subject" label={t("support.subject")} maxLength={MAX_SUBJECT} value={model.subject} onChangeText={model.setSubject} editable={!model.busy} />
        <View style={styles.field}>
          <TextField testID="report-body" label={t("support.body")} multiline maxLength={MAX_BODY} value={model.body} onChangeText={model.setBody} editable={!model.busy} style={styles.multiline} />
          <ThemedText variant="caption">{t("support.bodyHint")}</ThemedText>
        </View>
      </Card>
      <Card><ImagesField images={model.images} onChange={model.setImages} disabled={model.busy} /></Card>
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
      <Button testID="report-send" size="lg" title={model.busy ? t("support.sending") : t("support.send")} loading={model.busy} disabled={!model.canSend} onPress={model.send} />
    </>
  )
}

const useStyles = makeStyles(() => ({
  field: { gap: spacing.xs },
  multiline: { minHeight: 140, textAlignVertical: "top" },
}))
