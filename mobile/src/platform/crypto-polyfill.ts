import { install } from "react-native-quick-crypto"

/** Before any other module: core's vault expects the WebCrypto globals the browser has (learning 2026-11-18-quick-crypto-matches-web-vault). */
install()
