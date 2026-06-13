// V3.8 — Badge earned() logic tests.
import { BADGES } from '@/lib/badges';
import type { GameState } from '@/types';
import type { BadgeExtra } from '@/lib/badges';

// ── Shared base state ─────────────────────────────────────────────────────────

const baseState: GameState = {
  id: 'g-test',
  airlineName: 'Test Air',
  hqCityId: 'nyc',
  turn: 1,
  year: 2026,
  quarter: 3,
  cash: 420_000_000,
  fleet: [],
  routes: [],
  competitors: [],
  marketShare: 0,
  slotMarket: {
    nyc: { capacity: 12, taken: 2, playerHeld: 2, playerUsed: 0 },
  },
  news: [],
  finance: { lastQuarter: null, history: [] },
  status: 'active',
  lifetime: { profit: 0, pax: 0 },
  finalResult: null,
  activeEvents: [],
  brand: 50,
  marketing: { digital: 0, sponsor: 0, service: 0 },
  pendingDecision: null,
};

const findBadge = (id: string) => {
  const badge = BADGES.find((b) => b.id === id);
  if (!badge) throw new Error(`Badge not found: ${id}`);
  return badge;
};

// ── 1. firstFlight ────────────────────────────────────────────────────────────

describe('badge: firstFlight', () => {
  const badge = findBadge('firstFlight');

  it('false when no routes', () => {
    expect(badge.earned(baseState)).toBe(false);
  });

  it('true when at least one route exists', () => {
    const state: GameState = {
      ...baseState,
      routes: [
        {
          id: 'rt-1',
          cityA: 'nyc',
          cityB: 'lax',
          distanceKm: 3940,
          aircraftIds: [],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: null,
        },
      ],
    };
    expect(badge.earned(state)).toBe(true);
  });
});

// ── 2. firstProfit ────────────────────────────────────────────────────────────

describe('badge: firstProfit', () => {
  const badge = findBadge('firstProfit');

  it('false when lastQuarter is null', () => {
    expect(badge.earned(baseState)).toBe(false);
  });

  it('false when profit is 0', () => {
    const state: GameState = {
      ...baseState,
      finance: { lastQuarter: { revenue: 100_000, cost: 100_000, profit: 0 }, history: [] },
    };
    expect(badge.earned(state)).toBe(false);
  });

  it('true when profit > 0', () => {
    const state: GameState = {
      ...baseState,
      finance: { lastQuarter: { revenue: 200_000, cost: 100_000, profit: 100_000 }, history: [] },
    };
    expect(badge.earned(state)).toBe(true);
  });
});

// ── 3. loadFactor90 ───────────────────────────────────────────────────────────

describe('badge: loadFactor90', () => {
  const badge = findBadge('loadFactor90');

  it('false when no routes', () => {
    expect(badge.earned(baseState)).toBe(false);
  });

  it('false when loadFactor is 0.89', () => {
    const state: GameState = {
      ...baseState,
      routes: [
        {
          id: 'rt-1',
          cityA: 'nyc',
          cityB: 'lax',
          distanceKm: 3940,
          aircraftIds: [],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: {
            pax: 890,
            capacity: 1000,
            loadFactor: 0.89,
            revenue: 100_000,
            cost: 80_000,
            profit: 20_000,
            classes: {
              economy: { pax: 890, capacity: 1000, revenue: 100_000 },
              business: { pax: 0, capacity: 0, revenue: 0 },
              first: { pax: 0, capacity: 0, revenue: 0 },
            },
          },
        },
      ],
    };
    expect(badge.earned(state)).toBe(false);
  });

  it('true when loadFactor >= 0.90', () => {
    const state: GameState = {
      ...baseState,
      routes: [
        {
          id: 'rt-1',
          cityA: 'nyc',
          cityB: 'lax',
          distanceKm: 3940,
          aircraftIds: [],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: {
            pax: 900,
            capacity: 1000,
            loadFactor: 0.90,
            revenue: 110_000,
            cost: 80_000,
            profit: 30_000,
            classes: {
              economy: { pax: 900, capacity: 1000, revenue: 110_000 },
              business: { pax: 0, capacity: 0, revenue: 0 },
              first: { pax: 0, capacity: 0, revenue: 0 },
            },
          },
        },
      ],
    };
    expect(badge.earned(state)).toBe(true);
  });
});

// ── 4. fleet5 & fleet10 ───────────────────────────────────────────────────────

describe('badge: fleet5', () => {
  const badge = findBadge('fleet5');
  const makeFleet = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `ac-${i}`,
      modelId: 'a320neo',
      ownership: 'owned' as const,
      routeId: null,
    }));

  it('false when fleet size < 5', () => {
    expect(badge.earned({ ...baseState, fleet: makeFleet(4) })).toBe(false);
  });

  it('true when fleet size === 5', () => {
    expect(badge.earned({ ...baseState, fleet: makeFleet(5) })).toBe(true);
  });
});

describe('badge: fleet10', () => {
  const badge = findBadge('fleet10');
  const makeFleet = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `ac-${i}`,
      modelId: 'a320neo',
      ownership: 'owned' as const,
      routeId: null,
    }));

  it('false when fleet size < 10', () => {
    expect(badge.earned({ ...baseState, fleet: makeFleet(9) })).toBe(false);
  });

  it('true when fleet size === 10', () => {
    expect(badge.earned({ ...baseState, fleet: makeFleet(10) })).toBe(true);
  });
});

// ── 5. transOcean ────────────────────────────────────────────────────────────

describe('badge: transOcean', () => {
  const badge = findBadge('transOcean');

  it('false when no routes over 8000km', () => {
    const state: GameState = {
      ...baseState,
      routes: [
        {
          id: 'rt-1',
          cityA: 'nyc',
          cityB: 'lax',
          distanceKm: 3940,
          aircraftIds: [],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: null,
        },
      ],
    };
    expect(badge.earned(state)).toBe(false);
  });

  it('true when a route is > 8000km', () => {
    const state: GameState = {
      ...baseState,
      routes: [
        {
          id: 'rt-1',
          cityA: 'nyc',
          cityB: 'sin',
          distanceKm: 15300,
          aircraftIds: [],
          weeklyFlights: 3,
          fareMult: 1.2,
          cabinMix: { economy: 80, business: 20, first: 0 },
          serviceTier: 2,
          lastQuarter: null,
        },
      ],
    };
    expect(badge.earned(state)).toBe(true);
  });
});

// ── 6. crisisPR ──────────────────────────────────────────────────────────────

describe('badge: crisisPR', () => {
  const badge = findBadge('crisisPR');

  it('false when extra is undefined', () => {
    expect(badge.earned(baseState)).toBe(false);
  });

  it('false when hasPositiveBrandDecision is false', () => {
    const extra: BadgeExtra = { hasPositiveBrandDecision: false };
    expect(badge.earned(baseState, extra)).toBe(false);
  });

  it('true when hasPositiveBrandDecision is true', () => {
    const extra: BadgeExtra = { hasPositiveBrandDecision: true };
    expect(badge.earned(baseState, extra)).toBe(true);
  });
});

// ── 7. slotTycoon ────────────────────────────────────────────────────────────

describe('badge: slotTycoon', () => {
  const badge = findBadge('slotTycoon');

  it('false when total playerHeld < 8', () => {
    expect(badge.earned(baseState)).toBe(false);
  });

  it('true when total playerHeld >= 8 across cities', () => {
    const state: GameState = {
      ...baseState,
      slotMarket: {
        nyc: { capacity: 12, taken: 4, playerHeld: 4, playerUsed: 0 },
        lax: { capacity: 10, taken: 4, playerHeld: 4, playerUsed: 0 },
      },
    };
    expect(badge.earned(state)).toBe(true);
  });
});

// ── 8. billionaire ───────────────────────────────────────────────────────────

describe('badge: billionaire', () => {
  const badge = findBadge('billionaire');

  it('false when cash < 1B', () => {
    expect(badge.earned(baseState)).toBe(false);
  });

  it('true when cash >= 1B', () => {
    expect(badge.earned({ ...baseState, cash: 1_000_000_000 })).toBe(true);
  });
});

// ── 9. victory ───────────────────────────────────────────────────────────────

describe('badge: victory', () => {
  const badge = findBadge('victory');

  it('false when finalResult is null', () => {
    expect(badge.earned(baseState)).toBe(false);
  });

  it('false when victory is false', () => {
    const state: GameState = {
      ...baseState,
      finalResult: {
        rank: 2,
        victory: false,
        standings: [],
        cumulativeProfit: 0,
        cumulativePax: 0,
        endedTurn: 80,
      },
    };
    expect(badge.earned(state)).toBe(false);
  });

  it('true when victory is true', () => {
    const state: GameState = {
      ...baseState,
      finalResult: {
        rank: 1,
        victory: true,
        standings: [],
        cumulativeProfit: 500_000_000,
        cumulativePax: 1_000_000,
        endedTurn: 80,
      },
    };
    expect(badge.earned(state)).toBe(true);
  });
});

// ── 10. century ──────────────────────────────────────────────────────────────

describe('badge: century', () => {
  const badge = findBadge('century');

  it('false when turn < 80', () => {
    expect(badge.earned(baseState)).toBe(false);
  });

  it('false when turn === 80 but status === bankrupt', () => {
    expect(badge.earned({ ...baseState, turn: 80, status: 'bankrupt' })).toBe(false);
  });

  it('true when turn === 80 and status === finished', () => {
    expect(badge.earned({ ...baseState, turn: 80, status: 'finished' })).toBe(true);
  });
});
