import { router, useFocusEffect } from "expo-router"
import { useCallback } from "react"

import { TOURS } from "@mizan/core/tours/tours"
import { preferences, setPreferences } from "@/preferences"

const SETTLE_MS = 600

export const hasSeen = (id: string) => preferences().toursSeen.includes(id)

export function markSeen(id: string) {
  if (!hasSeen(id)) setPreferences({ toursSeen: [...preferences().toursSeen, id] })
}

export const forgetAllTours = () => setPreferences({ toursSeen: [] })

export function openTour(id: string) {
  if (TOURS[id]) router.push({ pathname: "/tour", params: { id } })
}

/** Opens a screen's tour once on this device when the screen comes into view and has its data. */
export function useScreenTour(id: string, ready = true) {
  useFocusEffect(
    useCallback(() => {
      if (!ready || hasSeen(id)) return
      const timer = setTimeout(() => openTour(id), SETTLE_MS)
      return () => clearTimeout(timer)
    }, [id, ready]),
  )
}
