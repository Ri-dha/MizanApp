import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Image, StyleSheet, View } from "react-native"

import { attachBytes, attachmentBytes, photoExpired, RECEIPT_RETENTION_DAYS, removeAttachment } from "@mizan/core/attachments/store"
import { table } from "@mizan/core/store/store"
import { useLiveQuery } from "@/hooks/use-core"
import { dataUriOf, takeReceiptPhoto, type PhotoSource } from "@/platform/receipt-photo"
import { radius, spacing } from "@/theme"
import { describeError } from "@/utils/errors"
import { Button } from "./button"
import { Notice } from "./notice"
import { ThemedText } from "./themed-text"

const JPEG = "image/jpeg"
const PREVIEW_HEIGHT = 220

/** The receipt photo of a record: encrypted on this phone, uploaded by the sync loop, gone after the retention period. */
export function ReceiptField({ attachmentId, ownerType, ownerRecordId, onChange }: {
  attachmentId: string | null
  ownerType: string
  ownerRecordId: string
  onChange: (attachmentId: string | null) => void
}) {
  const { t } = useTranslation()
  const attachment = useLiveQuery(() => (attachmentId ? table("attachments").get(attachmentId) : Promise.resolve(undefined)), [attachmentId], undefined)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const expired = attachment !== undefined && photoExpired(attachment)

  useEffect(() => {
    setPreview(null)
    if (!attachmentId) return
    let live = true
    attachmentBytes(attachmentId).then((file) => live && file && setPreview(dataUriOf(file.bytes, file.mimeType))).catch(() => undefined)
    return () => {
      live = false
    }
  }, [attachmentId])

  async function add(source: PhotoSource) {
    setError(null)
    try {
      const bytes = await takeReceiptPhoto(source)
      if (!bytes) return
      const id = await attachBytes(bytes, JPEG, ownerType, ownerRecordId)
      if (attachmentId) await removeAttachment(attachmentId)
      onChange(id)
    } catch (e) {
      setError(describeError(e))
    }
  }

  async function remove() {
    if (attachmentId) await removeAttachment(attachmentId)
    onChange(null)
  }

  return (
    <View style={styles.field}>
      <ThemedText variant="subhead">{t("transactions.receipt")}</ThemedText>
      <ThemedText variant="caption">{t("transactions.receiptKeptFor", { days: RECEIPT_RETENTION_DAYS })}</ThemedText>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {expired ? <ThemedText variant="subhead">{t("transactions.receiptRemoved", { days: RECEIPT_RETENTION_DAYS })}</ThemedText> : null}
      {preview ? <Image testID="receipt-preview" source={{ uri: preview }} style={styles.preview} resizeMode="contain" accessibilityLabel={t("transactions.receipt")} /> : null}
      <View style={styles.buttons}>
        <Button testID="receipt-camera" variant="secondary" title={t("transactions.takePhoto")} onPress={() => void add("camera")} />
        <Button testID="receipt-library" variant="secondary" title={t("transactions.choosePhoto")} onPress={() => void add("library")} />
        {attachmentId ? <Button testID="receipt-remove" variant="ghost" title={t("transactions.removeReceipt")} onPress={() => void remove()} /> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  preview: { width: "100%", height: PREVIEW_HEIGHT, borderRadius: radius.md },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
})
