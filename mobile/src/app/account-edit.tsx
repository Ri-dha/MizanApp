import { useLocalSearchParams } from "expo-router"

import { AccountEditor } from "@/screens/accounts/editor"

export default function AccountEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <AccountEditor id={id} />
}
