import { getLatestBrief } from "../api/endpoints";
import type { DailyBrief } from "../api/types";
import { type AsyncResult, useAsync } from "./useAsync";

/** Latest daily brief; data stays null when none has been generated yet. */
export const useLatestBrief = (): AsyncResult<DailyBrief | null> =>
  useAsync<DailyBrief | null>(() => getLatestBrief(), []);
