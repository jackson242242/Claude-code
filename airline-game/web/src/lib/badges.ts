// V3.8 Badge definitions — pure earned() checks, no side effects.
// All badge checks operate on GameState only (plus the optional decision track
// stored in profile via recordDecision).

import type { GameState } from '@/types';
import type { DictKeys } from '@/i18n/zh';

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export type BadgeId =
  | 'firstFlight'
  | 'firstProfit'
  | 'loadFactor90'
  | 'fleet5'
  | 'fleet10'
  | 'transOcean'
  | 'brandAmbassador'
  | 'marketingGuru'
  | 'crisisPR'
  | 'tier3Route'
  | 'slotTycoon'
  | 'share5'
  | 'share10'
  | 'victory'
  | 'century'
  | 'billionaire';

export type Badge = {
  id: BadgeId;
  tier: BadgeTier;
  nameKey: DictKeys;
  hintKey: DictKeys;
  /** Pure check — returns true if the badge is earned in the given state. */
  earned: (state: GameState, extra?: BadgeExtra) => boolean;
};

/** Extra runtime context that can't be derived from GameState alone. */
export type BadgeExtra = {
  /** Has the player ever resolved a decision with brandDelta > 0? */
  hasPositiveBrandDecision: boolean;
};

// ── Helper ────────────────────────────────────────────────────────────────────

const totalPlayerHeld = (state: GameState): number =>
  Object.values(state.slotMarket).reduce((sum, info) => sum + info.playerHeld, 0);

// ── Badge definitions ─────────────────────────────────────────────────────────

export const BADGES: readonly Badge[] = [
  {
    id: 'firstFlight',
    tier: 'bronze',
    nameKey: 'badge.firstFlight.name',
    hintKey: 'badge.firstFlight.hint',
    earned: (state) => state.routes.length > 0,
  },
  {
    id: 'firstProfit',
    tier: 'bronze',
    nameKey: 'badge.firstProfit.name',
    hintKey: 'badge.firstProfit.hint',
    earned: (state) => (state.finance.lastQuarter?.profit ?? -Infinity) > 0,
  },
  {
    id: 'loadFactor90',
    tier: 'silver',
    nameKey: 'badge.loadFactor90.name',
    hintKey: 'badge.loadFactor90.hint',
    earned: (state) =>
      state.routes.some((r) => (r.lastQuarter?.loadFactor ?? 0) >= 0.9),
  },
  {
    id: 'fleet5',
    tier: 'bronze',
    nameKey: 'badge.fleet5.name',
    hintKey: 'badge.fleet5.hint',
    earned: (state) => state.fleet.length >= 5,
  },
  {
    id: 'fleet10',
    tier: 'silver',
    nameKey: 'badge.fleet10.name',
    hintKey: 'badge.fleet10.hint',
    earned: (state) => state.fleet.length >= 10,
  },
  {
    id: 'transOcean',
    tier: 'silver',
    nameKey: 'badge.transOcean.name',
    hintKey: 'badge.transOcean.hint',
    earned: (state) => state.routes.some((r) => r.distanceKm > 8000),
  },
  {
    id: 'brandAmbassador',
    tier: 'silver',
    nameKey: 'badge.brandAmbassador.name',
    hintKey: 'badge.brandAmbassador.hint',
    earned: (state) => state.brand >= 75,
  },
  {
    id: 'marketingGuru',
    tier: 'bronze',
    nameKey: 'badge.marketingGuru.name',
    hintKey: 'badge.marketingGuru.hint',
    earned: (state) =>
      state.marketing.digital >= 8 ||
      state.marketing.sponsor >= 8 ||
      state.marketing.service >= 8,
  },
  {
    id: 'crisisPR',
    tier: 'bronze',
    nameKey: 'badge.crisisPR.name',
    hintKey: 'badge.crisisPR.hint',
    earned: (_state, extra) => extra?.hasPositiveBrandDecision ?? false,
  },
  {
    id: 'tier3Route',
    tier: 'silver',
    nameKey: 'badge.tier3Route.name',
    hintKey: 'badge.tier3Route.hint',
    earned: (state) => state.routes.some((r) => r.serviceTier === 3),
  },
  {
    id: 'slotTycoon',
    tier: 'silver',
    nameKey: 'badge.slotTycoon.name',
    hintKey: 'badge.slotTycoon.hint',
    earned: (state) => totalPlayerHeld(state) >= 8,
  },
  {
    id: 'share5',
    tier: 'bronze',
    nameKey: 'badge.share5.name',
    hintKey: 'badge.share5.hint',
    earned: (state) => state.marketShare >= 0.05,
  },
  {
    id: 'share10',
    tier: 'silver',
    nameKey: 'badge.share10.name',
    hintKey: 'badge.share10.hint',
    earned: (state) => state.marketShare >= 0.10,
  },
  {
    id: 'victory',
    tier: 'gold',
    nameKey: 'badge.victory.name',
    hintKey: 'badge.victory.hint',
    earned: (state) => state.finalResult?.victory === true,
  },
  {
    id: 'century',
    tier: 'gold',
    nameKey: 'badge.century.name',
    hintKey: 'badge.century.hint',
    earned: (state) => state.turn >= 80 && state.status !== 'bankrupt',
  },
  {
    id: 'billionaire',
    tier: 'gold',
    nameKey: 'badge.billionaire.name',
    hintKey: 'badge.billionaire.hint',
    earned: (state) => state.cash >= 1_000_000_000,
  },
] as const;

/** Tier color tokens for UI rendering. */
export const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#cd7f32',
  silver: '#a8a9ad',
  gold: '#ffd700',
};

/** XP awarded per tier when earning a badge. */
export const TIER_XP: Record<BadgeTier, number> = {
  bronze: 5,
  silver: 10,
  gold: 20,
};
