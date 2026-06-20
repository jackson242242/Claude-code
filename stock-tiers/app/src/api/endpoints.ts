import { apiFetch } from "./client";
import type { Horizon, HotStock, TickerDetail, TierList } from "./types";

export const getHotStocks = (): Promise<HotStock[]> =>
  apiFetch<HotStock[]>("/api/screener/hot-stocks");

export const getQuote = (ticker: string): Promise<TickerDetail> =>
  apiFetch<TickerDetail>(`/api/quotes/${encodeURIComponent(ticker)}`);

export const getTierList = (hotStockTicker: string): Promise<TierList> =>
  apiFetch<TierList>("/api/tiers", {
    method: "POST",
    body: JSON.stringify({ hotStockTicker }),
  });

export const getThesisTiers = (thesis: string, horizon: Horizon): Promise<TierList> =>
  apiFetch<TierList>("/api/tiers/thesis", {
    method: "POST",
    body: JSON.stringify({ thesis, horizon }),
  });
