import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Button } from "@/components/button"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Card } from "@/components/soft-kit"
import { ThemedText } from "@/components/themed-text"
import { makeStyles, spacing } from "@/theme"
import type { DataScreenModel } from "../use-data-screen"

/** Soft: the whole-household file in one card with its actions, then one row per spreadsheet with its two formats. */
export function DataSoft({ model }: { model: DataScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      {model.message ? <Notice>{model.message}</Notice> : null}
      <Card>
        <ThemedText variant="subhead">{t("data.body")}</ThemedText>
        <View style={styles.buttons}>
          <Button testID="data-export" variant="secondary" title={t("data.export")} onPress={model.exportAll} />
          {model.writes ? (
            <>
              <Button testID="data-import" variant="secondary" title={t("data.import")} onPress={model.importAll} />
              <Button testID="data-csv" variant="secondary" title={t("csv.button")} onPress={model.importCsv} />
            </>
          ) : null}
        </View>
      </Card>
      <View style={styles.section}>
        <ThemedText variant="caption">{t("exports.body")}</ThemedText>
        <Group>
          {model.kinds.map((item, index) => (
            <Row
              key={item.kind}
              last={index === model.kinds.length - 1}
              trailing={
                <View style={styles.formats}>
                  <Button testID={`export-${item.kind}-csv`} variant="ghost" title="CSV" onPress={item.csv} />
                  <Button testID={`export-${item.kind}-xlsx`} variant="ghost" title="Excel" onPress={item.xlsx} />
                </View>
              }
            >
              <ThemedText>{item.label}</ThemedText>
            </Row>
          ))}
        </Group>
      </View>
    </>
  )
}

const useStyles = makeStyles(() => ({
  section: { gap: spacing.sm },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  formats: { flexDirection: "row" },
}))
