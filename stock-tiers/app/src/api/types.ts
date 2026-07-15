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
  shares: number;
  trend: string | null;
  thesis: string | null;
  addedAt: string;
}

export interface AddPositionOptions {
  trend?: string | null;
  thesis?: string | null;
  shares?: number;
  entryPrice?: number;
  entryDate?: string;
}

export interface UpdatePositionFields {
  shares?: number;
  entryPrice?: number;
  entryDate?: string;
  trend?: string;
  thesis?: string;
}

export interface PortfolioHolding {
  ticker: string;
  name: string;
  entryPrice: number;
  entryDate: string;
  shares: number;
  trend: string | null;
  thesis: string | null;
  currentPrice: number | null;
  sinceEntryPct: number | null;
  oneYearChangePct: number | null;
  costBasis: number;
  marketValue: number | null;
  pnl: number | null;
  weightPct: number | null;
}

export interface TrendSlice {
  trend: string;
  tickers: string[];
  weightPct: number;
}

export interface PortfolioAlert {
  level: "info" | "warning";
  message: string;
}

export interface PortfolioView {
  holdings: PortfolioHolding[];
  trendSlices: TrendSlice[];
  totalCost: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number | null;
  alerts: PortfolioAlert[];
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

// --- Daily audio brief --------------------------------------------------------

export type BriefTopic = "股市" | "金融宏观" | "地缘政治" | "播客观点";

export interface BriefHighlight {
  topic: BriefTopic;
  headline: string;
  detail: string;
}

export interface SwingThesis {
  name: string;
  thesis: string;
  horizon: Horizon;
  whyNow: string;
}

export interface DailyBrief {
  id: string;
  title: string;
  date: string;
  script: string;
  highlights: BriefHighlight[];
  swingTheses: SwingThesis[];
  audioUrl: string | null;
  generatedAt: string;
  disclaimer: string;
}

// --- X KOL tracker --------------------------------------------------------------

export type KolPostType = "trade_call" | "pnl_boast" | "market_view" | "other";
export type KolClaimedResult = "gain" | "loss" | "neutral" | "unknown";
export type CallDirection = "long" | "short";

export interface KolPost {
  id: string;
  handle: string;
  date: string;
  url: string | null;
  excerpt: string;
  postType: KolPostType;
  claimedResult: KolClaimedResult;
  tickers: string[];
}

export interface KolCall {
  id: string;
  handle: string;
  ticker: string;
  direction: CallDirection;
  date: string;
  sourceExcerpt: string;
  entryPrice: number;
  currentPrice: number | null;
  returnPct: number | null;
}

export interface KolScoreboard {
  handle: string;
  postsAnalyzed: number;
  gainPosts: number;
  lossPosts: number;
  boastGainRatio: number | null;
  callsTracked: number;
  wins: number;
  losses: number;
  winRate: number | null;
  avgReturnPct: number | null;
  updatedAt: string;
}

export interface KolReport {
  handle: string;
  summary: string;
  scoreboard: KolScoreboard;
  recentPosts: KolPost[];
  calls: KolCall[];
  generatedAt: string;
  disclaimer: string;
}
