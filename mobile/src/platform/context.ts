import { createContext, useContext } from "react"

export interface PlatformInfo {
  cipherVersion: string
}

export const PlatformContext = createContext<PlatformInfo | null>(null)

export function usePlatformInfo(): PlatformInfo {
  const info = useContext(PlatformContext)
  if (!info) throw new Error("PLATFORM_NOT_READY")
  return info
}
