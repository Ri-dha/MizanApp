import type { HistoryInstrument } from "@mizan/core/market/series"
import type { Metal } from "@mizan/core/schema"
import { useHistory } from "@/hooks/use-market"

const GOLD: HistoryInstrument[] = ["XAU_LOCAL", "XAU_LOCAL_BID", "XAU", "USDIQD_PARALLEL"]
const SILVER: HistoryInstrument[] = ["XAG_LOCAL", "XAG_LOCAL_BID", "XAG", "USDIQD_PARALLEL"]

export const useMarketHistoryFor = (metal: Metal) => useHistory(metal === "GOLD" ? GOLD : SILVER)
