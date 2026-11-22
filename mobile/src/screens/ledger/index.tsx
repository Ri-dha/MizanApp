import { Stack } from "expo-router"
import { useTranslation } from "react-i18next"

import { viewFor } from "@mizan/core/domain/appStyle"
import { Button } from "@/components/button"
import { useAppStyle } from "@/theme"
import { useLedgerScreen } from "./use-ledger-screen"
import { LedgerSoft } from "./views/ledger-soft"

/** ADR styles-1: each template draws the screen its own way; a template without a view of its own gets Soft. */
const VIEWS = { soft: LedgerSoft }

export function Ledger() {
  const { t } = useTranslation()
  const model = useLedgerScreen()
  const View = viewFor(VIEWS, useAppStyle())
  return (
    <>
      <Stack.Screen
        options={{
          title: t("transactions.title"),
          headerRight: () => (model.canWrite ? <Button testID="open-add-transaction" variant="ghost" title={t("transactions.add")} onPress={model.add} /> : null),
          headerSearchBarOptions: { placeholder: t("transactions.search"), onChangeText: (event) => model.setText(event.nativeEvent.text) },
        }}
      />
      <View model={model} />
    </>
  )
}
