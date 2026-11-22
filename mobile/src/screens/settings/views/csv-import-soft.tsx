import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { Chips } from "@/components/chips"
import { Notice } from "@/components/notice"
import { Group, Row } from "@/components/row"
import { Badge, Card, Section, SectionTitle, Stat, Stats } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ThemedText } from "@/components/themed-text"
import { ToggleRow } from "@/components/toggle-row"
import { makeStyles, spacing } from "@/theme"
import type { CsvImportScreenModel } from "../use-csv-import-screen"

/** Soft: a card per column to say what it holds, the two choices that apply to every row, then the count tiles and the first rows with a badge each. */
export function CsvImportSoft({ model }: { model: CsvImportScreenModel }) {
  const { t } = useTranslation()
  const styles = useStyles()
  return (
    <>
      <ThemedText variant="subhead">{t("csv.body")}</ThemedText>
      {model.recalled ? <Notice>{t("csv.recalled", { name: model.recalled })}</Notice> : null}
      <Card>
        {model.columns.map((column) => (
          <View key={column.index} style={styles.field}>
            <SectionTitle>{column.label}</SectionTitle>
            <Chips testID={`csv-col-${column.index}`} options={model.fieldOptions} value={column.value} onChange={column.set} />
          </View>
        ))}
      </Card>
      <Card>
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("csv.positiveIs")}</ThemedText>
          <Chips options={model.signOptions} value={model.positiveIs} onChange={model.setPositiveIs} />
        </View>
        <View style={styles.field}>
          <ThemedText variant="subhead">{t("csv.bucket")}</ThemedText>
          <Chips options={model.bucketOptions} value={model.bucketId} onChange={model.setBucketId} />
        </View>
      </Card>
      <Section title={model.summary}>
        <Stats>
          <Stat label={t("csv.ok")} value={String(model.importCount)} tone="ok" />
          <Stat label={t("csv.duplicate")} value={String(model.duplicates)} />
        </Stats>
        <Group>
          {model.preview.map((row, index) => (
            <Row key={row.key} last={index === model.preview.length - 1} trailing={<ThemedText variant="subhead" style={styles.amount}>{row.amount}</ThemedText>}>
              <ThemedText style={row.failed ? styles.failed : null}>{row.title}</ThemedText>
              <Badge tone={row.failed ? "danger" : row.duplicate ? "warn" : "ok"}>{row.status}</Badge>
            </Row>
          ))}
        </Group>
      </Section>
      <ToggleRow label={t("csv.skipDuplicates")} value={model.skipDuplicates} onChange={model.setSkipDuplicates} />
      {model.recalled ? null : (
        <Card>
          <TextField testID="csv-profile" label={t("csv.remember")} placeholder={t("csv.rememberPlaceholder")} maxLength={40} value={model.profileName} onChangeText={model.setProfileName} />
          <ThemedText variant="caption">{t("csv.rememberHint")}</ThemedText>
        </Card>
      )}
    </>
  )
}

const useStyles = makeStyles((colors) => ({
  field: { gap: spacing.xs },
  amount: { fontVariant: ["tabular-nums"] },
  failed: { color: colors.destructive },
}))
