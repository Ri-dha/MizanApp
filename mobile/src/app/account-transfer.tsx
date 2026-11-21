import { useLocalSearchParams } from "expo-router"

import { AccountTransferEditor } from "@/screens/accounts/transfer"

export default function AccountTransferScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <AccountTransferEditor id={id} />
}
