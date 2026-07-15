import { getHotStocks } from "../api/endpoints";
import type { HotStock } from "../api/types";
import { type AsyncResult, useAsync } from "./useAsync";

export const useHotStocks = (): AsyncResult<HotStock[]> =>
  useAsync<HotStock[]>(() => getHotStocks(), []);
