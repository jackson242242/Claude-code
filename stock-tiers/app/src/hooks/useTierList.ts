import { getTierList } from "../api/endpoints";
import type { TierList } from "../api/types";
import { type AsyncResult, useAsync } from "./useAsync";

export const useTierList = (hotStockTicker: string): AsyncResult<TierList> =>
  useAsync<TierList>(() => getTierList(hotStockTicker), [hotStockTicker]);
