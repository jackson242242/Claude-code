// V3.8 — CEO Profile persistence, XP/level math, once-per-game guard.
import {
  loadProfile,
  saveProfile,
  getCeoLevel,
  getLevelProgress,
  recordBadge,
  awardGameEnd,
  PROFILE_KEY,
  CEO_LEVELS,
  XP_FINISH_GAME,
  XP_VICTORY,
} from '@/lib/profile';
import type { CeoProfile } from '@/lib/profile';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeProfile = (overrides: Partial<CeoProfile> = {}): CeoProfile => ({
  xp: 0,
  badges: {},
  gamesPlayed: 0,
  victories: 0,
  gamesAwarded: [],
  ...overrides,
});

// ── getCeoLevel — level boundary math ─────────────────────────────────────────

describe('getCeoLevel — XP thresholds', () => {
  it('level 0 at xp = 0', () => {
    expect(getCeoLevel(0)).toBe(0);
  });

  it('level 0 at xp = 99', () => {
    expect(getCeoLevel(99)).toBe(0);
  });

  it('level 1 at xp = 100 (threshold)', () => {
    expect(getCeoLevel(100)).toBe(1);
  });

  it('level 1 at xp = 249', () => {
    expect(getCeoLevel(249)).toBe(1);
  });

  it('level 2 at xp = 250 (threshold)', () => {
    expect(getCeoLevel(250)).toBe(2);
  });

  it('level 3 at xp = 500 (threshold)', () => {
    expect(getCeoLevel(500)).toBe(3);
  });

  it('level 4 at xp = 1000 (threshold)', () => {
    expect(getCeoLevel(1000)).toBe(4);
  });

  it('level 4 at xp > 1000 (stays at max)', () => {
    expect(getCeoLevel(9999)).toBe(4);
  });
});

// ── getLevelProgress ──────────────────────────────────────────────────────────

describe('getLevelProgress', () => {
  it('at max level, isMax is true and fraction is 1', () => {
    const { fraction, isMax } = getLevelProgress(1000);
    expect(isMax).toBe(true);
    expect(fraction).toBe(1);
  });

  it('at 0 XP, fraction is 0 and remaining is 100 (to level 1)', () => {
    const { fraction, remaining, isMax } = getLevelProgress(0);
    expect(isMax).toBe(false);
    expect(fraction).toBe(0);
    expect(remaining).toBe(CEO_LEVELS[1].threshold - 0);
  });

  it('at 50 XP (halfway to level 1), fraction is 0.5', () => {
    const { fraction } = getLevelProgress(50);
    expect(fraction).toBeCloseTo(0.5, 5);
  });
});

// ── recordBadge ───────────────────────────────────────────────────────────────

describe('recordBadge', () => {
  it('adds badge and awards XP for bronze tier (+5)', () => {
    const profile = makeProfile({ xp: 0 });
    const updated = recordBadge(profile, 'firstFlight', 'bronze');
    expect(updated.xp).toBe(5);
    expect(updated.badges['firstFlight']).toBeDefined();
  });

  it('awards +10 XP for silver tier', () => {
    const profile = makeProfile({ xp: 10 });
    const updated = recordBadge(profile, 'loadFactor90', 'silver');
    expect(updated.xp).toBe(20);
  });

  it('awards +20 XP for gold tier', () => {
    const profile = makeProfile({ xp: 50 });
    const updated = recordBadge(profile, 'victory', 'gold');
    expect(updated.xp).toBe(70);
  });

  it('does not double-award an already earned badge', () => {
    const alreadyEarnedAt = '2026-01-01T00:00:00.000Z';
    const profile = makeProfile({
      xp: 100,
      badges: { firstFlight: alreadyEarnedAt },
    });
    const updated = recordBadge(profile, 'firstFlight', 'bronze');
    expect(updated.xp).toBe(100); // unchanged
    expect(updated.badges['firstFlight']).toBe(alreadyEarnedAt); // unchanged timestamp
  });
});

// ── awardGameEnd — once-per-game guard ────────────────────────────────────────

describe('awardGameEnd', () => {
  it('awards XP_FINISH_GAME on non-victory game end', () => {
    const profile = makeProfile({ xp: 0 });
    const { profile: updated, awarded } = awardGameEnd(profile, 'game-1', false);
    expect(awarded).toBe(true);
    expect(updated.xp).toBe(XP_FINISH_GAME);
    expect(updated.gamesPlayed).toBe(1);
    expect(updated.victories).toBe(0);
    expect(updated.gamesAwarded).toContain('game-1');
  });

  it('awards XP_FINISH_GAME + XP_VICTORY on victory', () => {
    const profile = makeProfile({ xp: 0 });
    const { profile: updated, awarded } = awardGameEnd(profile, 'game-2', true);
    expect(awarded).toBe(true);
    expect(updated.xp).toBe(XP_FINISH_GAME + XP_VICTORY);
    expect(updated.victories).toBe(1);
  });

  it('does not award XP a second time for the same game id', () => {
    const profile = makeProfile({ xp: 200, gamesAwarded: ['game-3'] });
    const { profile: updated, awarded } = awardGameEnd(profile, 'game-3', true);
    expect(awarded).toBe(false);
    expect(updated.xp).toBe(200); // unchanged
  });

  it('does award XP for a different game id', () => {
    const profile = makeProfile({ xp: 200, gamesAwarded: ['game-3'] });
    const { profile: updated, awarded } = awardGameEnd(profile, 'game-4', false);
    expect(awarded).toBe(true);
    expect(updated.xp).toBe(200 + XP_FINISH_GAME);
    expect(updated.gamesAwarded).toContain('game-4');
    expect(updated.gamesAwarded).toContain('game-3');
  });
});

// ── loadProfile / saveProfile — persistence round-trip ───────────────────────

describe('profile persistence round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default profile when localStorage is empty', () => {
    const profile = loadProfile();
    expect(profile.xp).toBe(0);
    expect(profile.gamesPlayed).toBe(0);
    expect(profile.badges).toEqual({});
    expect(profile.gamesAwarded).toEqual([]);
  });

  it('saves and loads back a modified profile', () => {
    const profile = makeProfile({ xp: 350, gamesPlayed: 5, victories: 2 });
    profile.badges['firstFlight'] = '2026-01-01T00:00:00.000Z';
    saveProfile(profile);

    const loaded = loadProfile();
    expect(loaded.xp).toBe(350);
    expect(loaded.gamesPlayed).toBe(5);
    expect(loaded.victories).toBe(2);
    expect(loaded.badges['firstFlight']).toBe('2026-01-01T00:00:00.000Z');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(PROFILE_KEY, 'not-valid-json{{{');
    const profile = loadProfile();
    expect(profile.xp).toBe(0);
    expect(profile.badges).toEqual({});
  });
});
