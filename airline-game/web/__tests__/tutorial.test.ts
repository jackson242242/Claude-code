import { QUESTS, getQuestIndex } from '@/lib/tutorial';
import type { GameState } from '@/types';

const baseState: GameState = {
  id: 'g1',
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
};

describe('Quest 0 — negotiate slot', () => {
  it('isDone false: only hqCity has playerHeld === 2', () => {
    expect(QUESTS[0].isDone(baseState)).toBe(false);
  });

  it('isDone true: non-hq city has playerHeld >= 1', () => {
    const state: GameState = {
      ...baseState,
      slotMarket: {
        nyc: { capacity: 12, taken: 2, playerHeld: 2, playerUsed: 0 },
        lax: { capacity: 10, taken: 1, playerHeld: 1, playerUsed: 0 },
      },
    };
    expect(QUESTS[0].isDone(state)).toBe(true);
  });

  it('isDone true: hqCity has playerHeld > 2', () => {
    const state: GameState = {
      ...baseState,
      slotMarket: {
        nyc: { capacity: 12, taken: 3, playerHeld: 3, playerUsed: 0 },
      },
    };
    expect(QUESTS[0].isDone(state)).toBe(true);
  });

  it('isDone false: hqCity has playerHeld === 2, no other cities', () => {
    expect(QUESTS[0].isDone(baseState)).toBe(false);
  });
});

describe('Quest 1 — own first aircraft', () => {
  it('isDone false: no fleet', () => {
    expect(QUESTS[1].isDone(baseState)).toBe(false);
  });

  it('isDone true: one aircraft in fleet', () => {
    const state: GameState = {
      ...baseState,
      fleet: [{ id: 'ac-1', modelId: 'a320neo', ownership: 'owned', routeId: null }],
    };
    expect(QUESTS[1].isDone(state)).toBe(true);
  });
});

describe('Quest 2 — open first route', () => {
  it('isDone false: no routes', () => {
    expect(QUESTS[2].isDone(baseState)).toBe(false);
  });

  it('isDone true: one route exists', () => {
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
    expect(QUESTS[2].isDone(state)).toBe(true);
  });
});

describe('Quest 3 — assign aircraft to route', () => {
  it('isDone false: route with no aircraft', () => {
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
    expect(QUESTS[3].isDone(state)).toBe(false);
  });

  it('isDone true: route has assigned aircraft', () => {
    const state: GameState = {
      ...baseState,
      routes: [
        {
          id: 'rt-1',
          cityA: 'nyc',
          cityB: 'lax',
          distanceKm: 3940,
          aircraftIds: ['ac-1'],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: null,
        },
      ],
    };
    expect(QUESTS[3].isDone(state)).toBe(true);
  });
});

describe('Quest 4 — end first quarter', () => {
  it('isDone false: turn === 1', () => {
    expect(QUESTS[4].isDone(baseState)).toBe(false);
  });

  it('isDone true: turn > 1', () => {
    const state: GameState = { ...baseState, turn: 2 };
    expect(QUESTS[4].isDone(state)).toBe(true);
  });
});

describe('Quest 5 — load factor >= 70%', () => {
  it('isDone false: no routes', () => {
    expect(QUESTS[5].isDone(baseState)).toBe(false);
  });

  it('isDone false: loadFactor < 0.70', () => {
    const state: GameState = {
      ...baseState,
      routes: [
        {
          id: 'rt-1',
          cityA: 'nyc',
          cityB: 'lax',
          distanceKm: 3940,
          aircraftIds: ['ac-1'],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: {
            pax: 600,
            capacity: 1000,
            loadFactor: 0.60,
            revenue: 100_000,
            cost: 90_000,
            profit: 10_000,
            classes: {
              economy: { pax: 600, capacity: 1000, revenue: 100_000 },
              business: { pax: 0, capacity: 0, revenue: 0 },
              first: { pax: 0, capacity: 0, revenue: 0 },
            },
          },
        },
      ],
    };
    expect(QUESTS[5].isDone(state)).toBe(false);
  });

  it('isDone true: loadFactor === 0.70', () => {
    const state: GameState = {
      ...baseState,
      routes: [
        {
          id: 'rt-1',
          cityA: 'nyc',
          cityB: 'lax',
          distanceKm: 3940,
          aircraftIds: ['ac-1'],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: {
            pax: 700,
            capacity: 1000,
            loadFactor: 0.70,
            revenue: 120_000,
            cost: 90_000,
            profit: 30_000,
            classes: {
              economy: { pax: 700, capacity: 1000, revenue: 120_000 },
              business: { pax: 0, capacity: 0, revenue: 0 },
              first: { pax: 0, capacity: 0, revenue: 0 },
            },
          },
        },
      ],
    };
    expect(QUESTS[5].isDone(state)).toBe(true);
  });
});

describe('Quest 6 — positive quarterly profit', () => {
  it('isDone false: lastQuarter is null', () => {
    expect(QUESTS[6].isDone(baseState)).toBe(false);
  });

  it('isDone false: profit <= 0', () => {
    const state: GameState = {
      ...baseState,
      finance: { lastQuarter: { revenue: 100_000, cost: 100_000, profit: 0 }, history: [] },
    };
    expect(QUESTS[6].isDone(state)).toBe(false);
  });

  it('isDone true: profit > 0', () => {
    const state: GameState = {
      ...baseState,
      finance: { lastQuarter: { revenue: 200_000, cost: 100_000, profit: 100_000 }, history: [] },
    };
    expect(QUESTS[6].isDone(state)).toBe(true);
  });
});

describe('Quest 7 — open second route', () => {
  it('isDone false: only one route', () => {
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
    expect(QUESTS[7].isDone(state)).toBe(false);
  });

  it('isDone true: two routes', () => {
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
        {
          id: 'rt-2',
          cityA: 'nyc',
          cityB: 'ord',
          distanceKm: 1200,
          aircraftIds: [],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: null,
        },
      ],
    };
    expect(QUESTS[7].isDone(state)).toBe(true);
  });
});

describe('getQuestIndex', () => {
  it('returns 0 for brand-new state (no quests done)', () => {
    expect(getQuestIndex(baseState)).toBe(0);
  });

  it('returns QUESTS.length when all quests done', () => {
    // Build a state where all quests are complete
    const allDoneState: GameState = {
      id: 'g1',
      airlineName: 'Test Air',
      hqCityId: 'nyc',
      turn: 5,
      year: 2026,
      quarter: 3,
      cash: 500_000_000,
      fleet: [{ id: 'ac-1', modelId: 'a320neo', ownership: 'owned', routeId: 'rt-1' }],
      routes: [
        {
          id: 'rt-1',
          cityA: 'nyc',
          cityB: 'lax',
          distanceKm: 3940,
          aircraftIds: ['ac-1'],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: {
            pax: 800,
            capacity: 1000,
            loadFactor: 0.80,
            revenue: 150_000,
            cost: 90_000,
            profit: 60_000,
            classes: {
              economy: { pax: 800, capacity: 1000, revenue: 150_000 },
              business: { pax: 0, capacity: 0, revenue: 0 },
              first: { pax: 0, capacity: 0, revenue: 0 },
            },
          },
        },
        {
          id: 'rt-2',
          cityA: 'nyc',
          cityB: 'ord',
          distanceKm: 1200,
          aircraftIds: [],
          weeklyFlights: 7,
          fareMult: 1.0,
          cabinMix: { economy: 100, business: 0, first: 0 },
          serviceTier: 2,
          lastQuarter: null,
        },
      ],
      competitors: [],
      marketShare: 0.05,
      slotMarket: {
        nyc: { capacity: 12, taken: 3, playerHeld: 3, playerUsed: 0 },
        lax: { capacity: 10, taken: 1, playerHeld: 1, playerUsed: 0 },
      },
      news: [],
      finance: { lastQuarter: { revenue: 150_000, cost: 90_000, profit: 60_000 }, history: [] },
      status: 'active',
      lifetime: { profit: 60_000, pax: 800 },
      finalResult: null,
      activeEvents: [],
    };

    expect(getQuestIndex(allDoneState)).toBe(QUESTS.length);
  });

  it('returns correct index when only quest 0 is done', () => {
    const state: GameState = {
      ...baseState,
      slotMarket: {
        nyc: { capacity: 12, taken: 2, playerHeld: 2, playerUsed: 0 },
        lax: { capacity: 10, taken: 1, playerHeld: 1, playerUsed: 0 },
      },
    };
    expect(getQuestIndex(state)).toBe(1);
  });
});
