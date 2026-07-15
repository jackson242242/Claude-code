import { ApiError, apiFetch } from "./client";
import type {
  AddPositionOptions,
  DailyBrief,
  Horizon,
  HotStock,
  KolReport,
  PortfolioPosition,
  PortfolioView,
  ResearchReport,
  SecularTrend,
  TickerDetail,
  TierList,
  UpdatePositionFields,
} from "./types";

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

// --- Long-term portfolio + daily research + secular trends -------------------

export const getPortfolio = (): Promise<PortfolioView> =>
  apiFetch<PortfolioView>("/api/portfolio");

export const addToPortfolio = (
  ticker: string,
  options: AddPositionOptions = {},
): Promise<PortfolioPosition> =>
  apiFetch<PortfolioPosition>("/api/portfolio/positions", {
    method: "POST",
    body: JSON.stringify({
      ticker,
      trend: options.trend ?? null,
      thesis: options.thesis ?? null,
      // Omitted fields default server-side (1 share, live price, today).
      ...(options.shares !== undefined ? { shares: options.shares } : {}),
      ...(options.entryPrice !== undefined ? { entryPrice: options.entryPrice } : {}),
      ...(options.entryDate !== undefined ? { entryDate: options.entryDate } : {}),
    }),
  });

export const updatePosition = (
  ticker: string,
  fields: UpdatePositionFields,
): Promise<PortfolioPosition> =>
  apiFetch<PortfolioPosition>(`/api/portfolio/positions/${encodeURIComponent(ticker)}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });

export const removeFromPortfolio = (ticker: string): Promise<{ removed: string }> =>
  apiFetch<{ removed: string }>(`/api/portfolio/positions/${encodeURIComponent(ticker)}`, {
    method: "DELETE",
  });

/** Latest daily research report, or null if none has been run yet. */
export const getResearch = async (): Promise<ResearchReport | null> => {
  try {
    return await apiFetch<ResearchReport>("/api/portfolio/research");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
};

export const runResearch = (): Promise<ResearchReport> =>
  apiFetch<ResearchReport>("/api/portfolio/research/run", { method: "POST" });

export const getTrends = (): Promise<SecularTrend[]> => apiFetch<SecularTrend[]>("/api/trends");

export const discoverTrends = (): Promise<SecularTrend[]> =>
  apiFetch<SecularTrend[]>("/api/trends/discover", { method: "POST" });

/** Latest daily audio brief, or null if none has been generated yet. */
export const getLatestBrief = async (): Promise<DailyBrief | null> => {
  try {
    return await apiFetch<DailyBrief>("/api/briefs/latest");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
};

export const runBrief = (): Promise<DailyBrief> =>
  apiFetch<DailyBrief>("/api/briefs/run", { method: "POST" });

export const getKolReports = (): Promise<KolReport[]> => apiFetch<KolReport[]>("/api/kol");

export const runKolScan = (): Promise<KolReport[]> =>
  apiFetch<KolReport[]>("/api/kol/run", { method: "POST" });
