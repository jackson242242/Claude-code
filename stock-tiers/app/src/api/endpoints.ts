import { apiFetch } from "./client";
import type { HotStock, TickerDetail, TierList } from "./types";

export const getHotStocks = (): Promise<HotStock[]> =>
  apiFetch<HotStock[]>("/api/screener/hot-stocks");

export const getQuote = (ticker: string): Promise<TickerDetail> =>
  apiFetch<TickerDetail>(`/api/quotes/${encodeURIComponent(ticker)}`);

export const getTierList = (hotStockTicker: string): Promise<TierList> =>
  apiFetch<TierList>("/api/tiers", {
    method: "POST",
    body: JSON.stringify({ hotStockTicker }),
  });
