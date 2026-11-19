import { useSession } from "@/hooks/use-core"
import { Advisor } from "@/screens/advisor"
import { Home } from "@/screens/home"
import { audienceOf } from "@/utils/roles"

export default function HomeScreen() {
  return audienceOf(useSession()) === "ADVISOR" ? <Advisor /> : <Home />
}
