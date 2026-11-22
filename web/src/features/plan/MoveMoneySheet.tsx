import { lazy } from "react"

import { styleViews } from "@/app/style"
import { useMoveMoney, type MoveMoneyModel, type MoveMoneyProps } from "./useMoveMoney"

const MoveMoneyView = styleViews<{ model: MoveMoneyModel }>({
  soft: lazy(() => import("./views/MoveMoneySoft")),
})

export function MoveMoneySheet(props: MoveMoneyProps) {
  return <MoveMoneyView model={useMoveMoney(props)} />
}
