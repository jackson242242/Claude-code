// V3.8 CEO Profile — cross-game persistent profile stored in localStorage.
// Pure functions; no React dependencies.

import type { BadgeId, BadgeTier } from '@/lib/badges';
import { TIER_XP } from '@/lib/badges';

export const PROFILE_KEY = 'skyempire.profile';

// XP awarded for game completion (non-badge).
export const XP_FINISH_GAME = 30;
export const XP_VICTORY = 100;

// CEO level thresholds (cumulative XP required).
export type CeoLevelIndex = 0 | 1 | 2 | 3 | 4;

type LevelSpec = { threshold: number; titleKey: `ceo.level.${CeoLevelIndex}` };

export const CEO_LEVELS: readonly LevelSpec[] = [
  { threshold: 0, titleKey: 'ceo.level.0' },    // 实习调度 / Intern Dispatcher
  { threshold: 100, titleKey: 'ceo.level.1' },   // 区域经理 / Regional Manager
  { threshold: 250, titleKey: 'ceo.level.2' },   // 运营总监 / Operations Director
  { threshold: 500, titleKey: 'ceo.level.3' },   // 航司CEO / Airline CEO
  { threshold: 1000, titleKey: 'ceo.level.4' },  // 航空大亨 / Aviation Tycoon
] as const;

export type CeoProfile = {
  /** Cumulative XP across all games. */
  xp: number;
  /** Map of badgeId → ISO timestamp when first earned. */
  badges: Partial<Record<BadgeId, string>>;
  /** Total number of games played to completion or bankruptcy. */
  gamesPlayed: number;
  /** Total victory count. */
  victories: number;
  /** Game IDs for which game-end XP has already been awarded (prevents double-award). */
  gamesAwarded: string[];
};

const DEFAULT_PROFILE: CeoProfile = {
  xp: 0,
  badges: {},
  gamesPlayed: 0,
  victories: 0,
  gamesAwarded: [],
};

// ── Persistence helpers ───────────────────────────────────────────────────────

export const loadProfile = (): CeoProfile => {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE, badges: {}, gamesAwarded: [] };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE, badges: {}, gamesAwarded: [] };
    const parsed = JSON.parse(raw) as Partial<CeoProfile>;
    return {
      xp: parsed.xp ?? 0,
      badges: parsed.badges ?? {},
      gamesPlayed: parsed.gamesPlayed ?? 0,
      victories: parsed.victories ?? 0,
      gamesAwarded: parsed.gamesAwarded ?? [],
    };
  } catch {
    return { ...DEFAULT_PROFILE, badges: {}, gamesAwarded: [] };
  }
};

export const saveProfile = (profile: CeoProfile): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

// ── Level calculation ─────────────────────────────────────────────────────────

/** Returns the current 0-based CEO level index (0–4). */
export const getCeoLevel = (xp: number): CeoLevelIndex => {
  let level: CeoLevelIndex = 0;
  for (let i = CEO_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= CEO_LEVELS[i].threshold) {
      level = i as CeoLevelIndex;
      break;
    }
  }
  return level;
};

/** XP progress within the current level band (0–1 fraction). */
export const getLevelProgress = (xp: number): { fraction: number; remaining: number; isMax: boolean } => {
  const level = getCeoLevel(xp);
  const isMax = level === (CEO_LEVELS.length - 1 as CeoLevelIndex);
  if (isMax) {
    return { fraction: 1, remaining: 0, isMax: true };
  }
  const current = CEO_LEVELS[level].threshold;
  const next = CEO_LEVELS[level + 1].threshold;
  const fraction = (xp - current) / (next - current);
  const remaining = next - xp;
  return { fraction: Math.min(1, Math.max(0, fraction)), remaining, isMax: false };
};

// ── Mutation helpers ──────────────────────────────────────────────────────────

/**
 * Record a newly earned badge onto the profile.
 * Returns the updated profile (does NOT save — caller must call saveProfile).
 */
export const recordBadge = (
  profile: CeoProfile,
  badgeId: BadgeId,
  tier: BadgeTier,
): CeoProfile => {
  if (profile.badges[badgeId]) return profile; // already earned
  return {
    ...profile,
    xp: profile.xp + TIER_XP[tier],
    badges: { ...profile.badges, [badgeId]: new Date().toISOString() },
  };
};

/**
 * Award game-end XP once per game id.
 * Returns { profile, awarded } — awarded=true if XP was actually given.
 */
export const awardGameEnd = (
  profile: CeoProfile,
  gameId: string,
  victory: boolean,
): { profile: CeoProfile; awarded: boolean } => {
  if (profile.gamesAwarded.includes(gameId)) {
    return { profile, awarded: false };
  }
  const xpGain = XP_FINISH_GAME + (victory ? XP_VICTORY : 0);
  const updated: CeoProfile = {
    ...profile,
    xp: profile.xp + xpGain,
    gamesPlayed: profile.gamesPlayed + 1,
    victories: profile.victories + (victory ? 1 : 0),
    gamesAwarded: [...profile.gamesAwarded, gameId],
  };
  return { profile: updated, awarded: true };
};

/**
 * Record a decision where the player chose a brandDelta > 0 option.
 * This is persisted in a lightweight way via a dedicated localStorage key
 * so badges.ts can check it without coupling to profile schema.
 */
export const DECISION_KEY = 'skyempire.positiveBrandDecision';

export const recordPositiveBrandDecision = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DECISION_KEY, '1');
};

export const hasPositiveBrandDecision = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(DECISION_KEY) === '1';
};
