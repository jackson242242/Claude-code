import { getPortfolio } from "../api/endpoints";
import type { PortfolioView } from "../api/types";
import { type AsyncResult, useAsync } from "./useAsync";

export const usePortfolio = (): AsyncResult<PortfolioView> =>
  useAsync<PortfolioView>(() => getPortfolio(), []);
