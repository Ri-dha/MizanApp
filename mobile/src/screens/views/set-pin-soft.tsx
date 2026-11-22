import { useTranslation } from "react-i18next"

import { Button } from "@/components/button"
import { Badge } from "@/components/soft-kit"
import { TextField } from "@/components/text-field"
import { ToggleRow } from "@/components/toggle-row"
import type { SetPinScreenModel } from "../use-set-pin-screen"
import { FrontIntro, LockTile } from "./front-parts"

const MAX_PIN = 8

/** Soft: a lock tile, the title and why, the two PIN fields with a warning badge while they differ, then one wide button. */
export function SetPinSoft({ model }: { model: SetPinScreenModel }) {
  const { t } = useTranslation()
  return (
    <>
      <FrontIntro mark={<LockTile />} title={t("lock.setTitle")} body={t("lock.setBody")} />
      <TextField testID="new-pin" label={t("lock.pin")} keyboardType="number-pad" secureTextEntry maxLength={MAX_PIN} value={model.pin} onChangeText={model.setPin} />
      <TextField testID="repeat-pin" label={t("lock.confirmPin")} keyboardType="number-pad" secureTextEntry maxLength={MAX_PIN} value={model.repeat} onChangeText={model.setRepeat} />
      {model.mismatch ? <Badge tone="warn">{t("lock.pinMismatch")}</Badge> : null}
      {model.canUseBiometrics ? <ToggleRow testID="enrol-biometrics" label={t("lock.enrollBiometric")} value={model.withBiometrics} onChange={model.setWithBiometrics} /> : null}
      <Button testID="save-pin" size="lg" title={t("lock.save")} loading={model.busy} disabled={!model.canSave} onPress={model.save} />
    </>
  )
}
