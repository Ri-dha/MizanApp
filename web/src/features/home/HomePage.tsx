import { lazy } from "react"
import { Navigate } from "react-router"

import { styleViews } from "@/app/style"
import { useHomePage, type HomePageModel } from "./useHomePage"

const HomeView = styleViews<{ model: HomePageModel }>({
  soft: lazy(() => import("./views/HomeSoft")),
})

export function HomePage() {
  const model = useHomePage()
  if (model.audience === "advisor") return <Navigate to="/advisor" replace />
  return <HomeView model={model} />
}
