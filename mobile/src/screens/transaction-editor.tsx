import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { Screen } from "@/components/screen"
import { useAppStyle } from "@/theme"
import { useTransactionEditor } from "./transaction/use-transaction-editor"
import { TransactionEditorSoft } from "./transaction/views/transaction-editor-soft"

/** ADR styles-1: each template draws the sheet its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: TransactionEditorSoft }

export function TransactionEditor({ id }: { id?: string }) {
  const { t } = useTranslation()
  const model = useTransactionEditor(id)
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <Screen sheet>
      <Stack.Screen
        options={{
          title: id ? t("transactions.edit") : t("transactions.add"),
          headerRight: () => <Button testID="save-transaction" variant="ghost" title={t("accounts.save")} disabled={!model.canSave || model.partOfSplit} onPress={model.save} />,
        }}
      />
      <View model={model} />
    </Screen>
  )
}
