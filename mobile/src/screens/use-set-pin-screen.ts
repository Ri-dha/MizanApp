import { useEffect, useState } from "react"

import { biometricUnlock, setPin } from "@mizan/core/lock/store"

const PIN_PATTERN = /^\d{4,8}$/

/** Everything the Set a PIN screen knows and can do; the templates only decide how it is drawn (ADR styles-1). */
export function useSetPinScreen() {
  const [pin, setPinText] = useState("")
  const [repeat, setRepeat] = useState("")
  const [withBiometrics, setWithBiometrics] = useState(false)
  const [canUseBiometrics, setCanUseBiometrics] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void biometricUnlock().available().then(setCanUseBiometrics)
  }, [])

  async function save() {
    setBusy(true)
    try {
      const dataKey = await setPin(pin)
      if (withBiometrics) await biometricUnlock().enrol(dataKey)
    } finally {
      setBusy(false)
    }
  }

  return {
    pin, setPin: setPinText, repeat, setRepeat, withBiometrics, setWithBiometrics, canUseBiometrics, busy,
    mismatch: repeat.length > 0 && repeat !== pin,
    canSave: PIN_PATTERN.test(pin) && pin === repeat,
    save: () => void save(),
  }
}

export type SetPinScreenModel = ReturnType<typeof useSetPinScreen>
