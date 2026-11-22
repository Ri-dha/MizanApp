import { useEffect, useState } from "react"

import { biometricUnlock, unlockWithBiometrics, unlockWithPin } from "@mizan/core/lock/store"

const MIN_PIN = 4

/** Everything the lock screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useLockScreen() {
  const [pin, setPin] = useState("")
  const [wrong, setWrong] = useState(false)
  const [biometric, setBiometric] = useState(false)

  useEffect(() => {
    void biometricUnlock().enrolled().then((enrolled) => {
      setBiometric(enrolled)
      if (enrolled) void unlockWithBiometrics()
    })
  }, [])

  async function submit() {
    const ok = await unlockWithPin(pin)
    setWrong(!ok)
    setPin("")
  }

  return { pin, setPin, wrong, biometric, canSubmit: pin.length >= MIN_PIN, submit: () => void submit(), useBiometrics: () => void unlockWithBiometrics() }
}

export type LockScreenModel = ReturnType<typeof useLockScreen>
