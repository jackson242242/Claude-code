import { getTrends } from "../api/endpoints";
import type { SecularTrend } from "../api/types";
import { type AsyncResult, useAsync } from "./useAsync";

export const useTrends = (): AsyncResult<SecularTrend[]> =>
  useAsync<SecularTrend[]>(() => getTrends(), []);
