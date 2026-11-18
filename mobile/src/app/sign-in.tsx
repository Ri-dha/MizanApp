import { Stack } from "expo-router"

import { SignIn } from "@/screens/sign-in"

export default function SignInScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SignIn />
    </>
  )
}
