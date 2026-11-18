import { installSecretStore } from "@mizan/core/platform/secretStore"
import { installStore } from "@mizan/core/store/store"
import "@/api/client"
import { db } from "@/db/schema"
import { deviceSecretStore } from "./deviceSecretStore"
import { dexieStore } from "./dexieStore"

installStore(dexieStore(db))
installSecretStore(deviceSecretStore)
