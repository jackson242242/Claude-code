import { getResearch } from "../api/endpoints";
import type { ResearchReport } from "../api/types";
import { type AsyncResult, useAsync } from "./useAsync";

/** Latest daily research report; data stays null when none has been run yet. */
export const useResearch = (): AsyncResult<ResearchReport | null> =>
  useAsync<ResearchReport | null>(() => getResearch(), []);
