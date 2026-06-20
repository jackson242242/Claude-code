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
