import { useLocalSearchParams } from "expo-router"

import { JoinHousehold } from "@/screens/household/join"

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  return <JoinHousehold token={token} />
}
