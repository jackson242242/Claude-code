import { getQuote } from "../api/endpoints";
import type { TickerDetail } from "../api/types";
import { type AsyncResult, useAsync } from "./useAsync";

export const useQuote = (ticker: string): AsyncResult<TickerDetail> =>
  useAsync<TickerDetail>(() => getQuote(ticker), [ticker]);
