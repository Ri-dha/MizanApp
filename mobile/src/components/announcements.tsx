import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { api, unwrap } from "@mizan/core/api/client"
import type { components } from "@mizan/core/api/generated"
import { preferences, setPreferences } from "@/preferences"
import { spacing } from "@/theme"
import { Button } from "./button"
import { Notice } from "./notice"

type Announcement = components["schemas"]["AnnouncementResponse"]

const REFRESH_MS = 10 * 60 * 1000
const REMEMBERED = 50

/** Notices from the operators (ADR admin-1), in the reader's language; each can be closed once read. */
export function Announcements() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<Announcement[]>([])
  const [hidden, setHidden] = useState<string[]>(() => preferences().dismissedAnnouncements)

  useEffect(() => {
    const load = () => void unwrap(api().GET("/api/v1/announcements")).then(setItems).catch(() => undefined)
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [])

  function close(id: string) {
    const next = [...hidden, id].slice(-REMEMBERED)
    setHidden(next)
    setPreferences({ dismissedAnnouncements: next })
  }

  const shown = items.filter((a) => a.id && !hidden.includes(a.id))
  if (shown.length === 0) return null
  return (
    <View style={styles.list}>
      {shown.map((a) => (
        <View key={a.id} style={styles.item}>
          <Notice tone={a.level === "WARNING" ? "error" : "info"}>{(i18n.language === "ar" ? a.messageAr : a.messageEn) ?? ""}</Notice>
          <Button variant="ghost" title={t("admin.announcements.dismiss")} style={styles.close} onPress={() => close(a.id!)} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  item: { gap: spacing.xs },
  close: { alignSelf: "flex-end" },
})
