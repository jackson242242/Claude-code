import { getThesisTiers } from "../api/endpoints";
import type { Horizon, TierList } from "../api/types";
import { type AsyncResult, useAsync } from "./useAsync";

export const useThesisTiers = (thesis: string, horizon: Horizon): AsyncResult<TierList> =>
  useAsync<TierList>(() => getThesisTiers(thesis, horizon), [thesis, horizon]);
