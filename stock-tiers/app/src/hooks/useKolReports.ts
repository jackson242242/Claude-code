import { getKolReports } from "../api/endpoints";
import type { KolReport } from "../api/types";
import { type AsyncResult, useAsync } from "./useAsync";

export const useKolReports = (): AsyncResult<KolReport[]> =>
  useAsync<KolReport[]>(() => getKolReports(), []);
