import { useTranslation } from "react-i18next"
import { Image, Modal, Pressable, View } from "react-native"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, radius, spacing } from "@/theme"
import type { ImagesFieldModel, ReportImageModel } from "../use-images-screen"

const THUMB = 80

/** Soft: the chosen pictures as rounded tiles with a round remove mark, then the add button and how many are allowed. */
export function ImagesFieldSoft({ model }: { model: ImagesFieldModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <View style={styles.field}>
      {model.images.length > 0 ? (
        <View style={styles.thumbs}>
          {model.images.map((image, i) => (
            <View key={image.uri} style={styles.thumb}>
              <Image source={{ uri: image.uri }} style={styles.fill} accessibilityLabel={t("support.imageAlt", { number: image.number })} />
              <Pressable
                testID={`report-image-remove-${i}`}
                accessibilityRole="button"
                accessibilityLabel={t("support.removeImage", { number: image.number })}
                disabled={model.disabled}
                hitSlop={spacing.sm}
                onPress={image.remove}
                style={styles.remove}
              >
                <ThemedText variant="caption" style={styles.removeMark}>✕</ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {model.canAdd ? <Button testID="report-add-image" variant="secondary" title={t("support.addImage")} loading={model.preparing} disabled={model.disabled} onPress={model.add} style={styles.add} /> : null}
      <ThemedText variant="caption">{t("support.imageHint", { count: model.max })}</ThemedText>
      {model.error ? <Notice tone="error">{model.error}</Notice> : null}
    </View>
  )
}

/** Soft: a rounded tile; one the server has removed keeps its place with a dashed edge. */
export function ReportImageSoft({ model }: { model: ReportImageModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  const label = t("support.imageAlt", { number: model.number })
  if (model.removed) {
    return (
      <View testID={`report-image-removed-${model.id}`} accessible accessibilityLabel={t("support.imageRemoved")} style={[styles.thumb, styles.placeholder, styles.removed]}>
        <ThemedText variant="caption" style={styles.centred}>{t("support.imageRemovedShort")}</ThemedText>
      </View>
    )
  }
  if (model.failed) return <View style={[styles.thumb, styles.placeholder]}><ThemedText variant="caption">{t("support.imageFailed")}</ThemedText></View>
  if (!model.uri) return <View style={[styles.thumb, styles.placeholder]} />
  return (
    <>
      <Pressable testID={`report-image-${model.id}`} accessibilityRole="imagebutton" accessibilityLabel={t("support.openImage", { number: model.number })} onPress={model.show} style={styles.thumb}>
        <Image source={{ uri: model.uri }} style={styles.fill} accessibilityLabel={label} />
      </Pressable>
      <Modal visible={model.open} animationType="fade" onRequestClose={model.hide} supportedOrientations={["portrait", "landscape"]}>
        <Pressable testID="report-image-close" accessibilityRole="button" accessibilityLabel={t("support.closeImage")} style={styles.viewer} onPress={model.hide}>
          <Image source={{ uri: model.uri }} style={styles.fill} resizeMode="contain" accessibilityLabel={label} />
        </Pressable>
      </Modal>
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  field: { gap: spacing.sm },
  thumbs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.md, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.fill },
  placeholder: { alignItems: "center", justifyContent: "center", padding: spacing.xs },
  fill: { width: "100%", height: "100%" },
  removed: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.outline },
  centred: { textAlign: "center" },
  remove: { position: "absolute", top: spacing.xs, end: spacing.xs, width: spacing.lg, height: spacing.lg, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  removeMark: { color: colors.label },
  add: { alignSelf: "flex-start" },
  // A photo is judged against black whatever the template, as in any picture viewer.
  viewer: { flex: 1, backgroundColor: "#000" },
}))
