import * as Clipboard from "expo-clipboard"

import { acknowledgeRecoveryCode } from "@mizan/core/vault/account"

/** The recovery code is shown once; the person copies it and says they have kept it. */
export function useRecoveryCodeScreen(code: string) {
  return {
    code,
    copy: () => void Clipboard.setStringAsync(code),
    saved: () => void acknowledgeRecoveryCode(),
  }
}

export type RecoveryCodeScreenModel = ReturnType<typeof useRecoveryCodeScreen>
