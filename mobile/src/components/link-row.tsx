import { Link, type Href } from "expo-router"
import type { ReactNode } from "react"
import { Pressable } from "react-native"

import { makeStyles } from "@/theme"
import { Row } from "./row"
import { ThemedText } from "./themed-text"

/** A list row that opens another screen, with the platform's disclosure mark. */
export function LinkRow({ href, children, trailing, last, testID }: { href: Href; children: ReactNode; trailing?: ReactNode; last?: boolean; testID?: string }) {
  const styles = useStyles()
  return (
    <Link href={href} asChild>
      <Pressable testID={testID} accessibilityRole="link" style={({ pressed }) => (pressed ? styles.pressed : null)}>
        <Row last={last} trailing={trailing ?? <ThemedText variant="subhead">›</ThemedText>}>{children}</Row>
      </Pressable>
    </Link>
  )
}

const useStyles = makeStyles((colors) => ({
  pressed: { backgroundColor: colors.fill },
}))
