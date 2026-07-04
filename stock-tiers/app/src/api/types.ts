// TypeScript mirror of the backend camelCase wire contract (backend/app/schemas.py).
// Keep these in sync 1:1.

export type Tier = "S" | "A" | "B" | "C" | "D" | "F";
export type Relationship = "alternative" | "downstream";
export type Horizon = "short" | "medium" | "long";

export const TIER_ORDER: readonly Tier[] = ["S", "A", "B", "C", "D", "F"];

export interface HotStock {
  ticker: string;
  name: string;
  price: number;
  oneYearChangePct: number;
  sector: string;
}

export interface TickerDetail {
  ticker: string;
  name: string;
  price: number;
  oneYearChangePct: number;
  sector: string;
  currency: string;
}

export interface TierEntry {
  ticker: string;
  name: string;
  price: number;
  oneYearChangePct: number;
  tier: Tier;
  relationship: Relationship;
  rationale: string;
  tierJustification: string;
}

export interface TierList {
  hotStockTicker: string;
  thesis: string;
  tiers: Record<Tier, TierEntry[]>;
  disclaimer: string;
  generatedAt: string;
}

export interface ApiErrorBody {
  error: { message: string; type: string };
}

// --- Long-term portfolio + daily research + secular trends -------------------

export type ThesisStatus = "strengthening" | "intact" | "weakening" | "broken";

export interface PortfolioPosition {
  ticker: string;
  name: string;
  entryPrice: number;
  entryDate: string;
  trend: string | null;
  thesis: string | null;
  addedAt: string;
}

export interface PortfolioHolding {
  ticker: string;
  name: string;
  entryPrice: number;
  entryDate: string;
  trend: string | null;
  thesis: string | null;
  currentPrice: number | null;
  sinceEntryPct: number | null;
  oneYearChangePct: number | null;
}

export interface TrendSlice {
  trend: string;
  tickers: string[];
  weightPct: number;
}

export interface PortfolioView {
  holdings: PortfolioHolding[];
  trendSlices: TrendSlice[];
  disclaimer: string;
  generatedAt: string;
}

export interface SecularTrend {
  id: string;
  name: string;
  category: string;
  thesis: string;
  whyNow: string;
  horizon: Horizon;
  discoveredAt: string;
}

export interface HoldingNote {
  ticker: string;
  headline: string;
  thesisStatus: ThesisStatus;
  note: string;
}

export interface ResearchReport {
  summary: string;
  notes: HoldingNote[];
  diversification: string;
  generatedAt: string;
  disclaimer: string;
}
