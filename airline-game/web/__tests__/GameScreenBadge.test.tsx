/**
 * V3.8 — Badge toast integration test for GameScreen.
 * Verifies that:
 * 1. badge detection calls saveProfile when a badge is earned on state transition
 * 2. speakBadge is called for newly earned badges
 * 3. the badge-toast element appears in the DOM after timer fires
 */

// Mock voice to avoid SpeechSynthesis in tests.
jest.mock('@/lib/voice', () => ({
  voice: {
    speakBadge: jest.fn(),
    speakDecision: jest.fn(),
    speakDecisionResult: jest.fn(),
    speakTurnReport: jest.fn(),
    speakMajorEvent: jest.fn(),
    speakQuestDone: jest.fn(),
    isEnabled: jest.fn().mockReturnValue(false),
    toggle: jest.fn(),
    cancel: jest.fn(),
  },
}));

// Mock audio to avoid Web Audio API.
jest.mock('@/lib/audio', () => ({
  audio: {
    isPlaying: jest.fn().mockReturnValue(false),
    start: jest.fn(),
    toggle: jest.fn(),
  },
}));

// Mock data (avoid loading real SVG map assets etc.).
jest.mock('@/lib/data', () => ({
  CITIES: [],
  CITY_IMAGES: {},
  AIRCRAFT_IMAGES: {},
  AIRCRAFT_MODELS: [],
  CITY_BY_ID: new Map(),
  MODEL_BY_ID: new Map(),
  cityLabel: (id: string) => id,
  cityZh: (id: string) => id,
  modelName: (id: string) => id,
}));

// Mock WorldMap to avoid SVG/canvas dependencies.
jest.mock('@/components/WorldMap', () => ({
  WorldMap: () => null,
}));

// Profile mock — controlled via module-level variable so the factory captures it.
let mockProfileBadges: Record<string, string> = {};

jest.mock('@/lib/profile', () => ({
  loadProfile: jest.fn(() => ({
    xp: 0,
    badges: mockProfileBadges,
    gamesPlayed: 0,
    victories: 0,
    gamesAwarded: [],
  })),
  saveProfile: jest.fn(),
  recordBadge: jest.fn(
    (profile: { xp: number; badges: Record<string, string> }, id: string) => ({
      ...profile,
      xp: profile.xp + 5,
      badges: { ...profile.badges, [id]: new Date().toISOString() },
    }),
  ),
  recordPositiveBrandDecision: jest.fn(),
  hasPositiveBrandDecision: jest.fn(() => false),
}));

import { render, screen, act, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { I18nProvider } from '@/i18n';
import { GameScreen } from '@/components/GameScreen';
import type { GameState } from '@/types';

const baseState: GameState = {
  id: 'g-badge-test',
  airlineName: 'Badge Air',
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

const stateWithRoute: GameState = {
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

const wrap = (node: React.ReactNode) => createElement(I18nProvider, null, node);
const noop = () => undefined;

describe('GameScreen badge detection on state transition', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockProfileBadges = {};
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Only run timers if fake timers are still active (some tests switch to real timers).
    try {
      act(() => { jest.runAllTimers(); });
    } catch {
      // Real timers — nothing to drain.
    }
    jest.useRealTimers();
  });

  it('calls saveProfile when firstFlight badge is newly earned', () => {
    const { rerender } = render(
      wrap(createElement(GameScreen, {
        state: baseState, busy: false, error: null,
        onDismissError: noop, onCommands: noop, onEndTurn: noop,
      })),
    );

    const { saveProfile } = jest.requireMock('@/lib/profile') as { saveProfile: jest.Mock };
    const callsBefore = saveProfile.mock.calls.length;

    act(() => {
      rerender(wrap(createElement(GameScreen, {
        state: stateWithRoute, busy: false, error: null,
        onDismissError: noop, onCommands: noop, onEndTurn: noop,
      })));
    });

    // saveProfile should have been called at least once (badge earned).
    expect(saveProfile.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('calls speakBadge when firstFlight badge is newly earned', async () => {
    const { rerender } = render(
      wrap(createElement(GameScreen, {
        state: baseState, busy: false, error: null,
        onDismissError: noop, onCommands: noop, onEndTurn: noop,
      })),
    );

    const { voice } = jest.requireMock('@/lib/voice') as { voice: { speakBadge: jest.Mock } };

    act(() => {
      rerender(wrap(createElement(GameScreen, {
        state: stateWithRoute, busy: false, error: null,
        onDismissError: noop, onCommands: noop, onEndTurn: noop,
      })));
    });

    act(() => { jest.runAllTimers(); });

    expect(voice.speakBadge).toHaveBeenCalled();
  });

  it('shows badge-toast in DOM after timer fires on badge earn', async () => {
    // Switch to real timers for this test so waitFor polling works.
    jest.useRealTimers();

    const { rerender } = render(
      wrap(createElement(GameScreen, {
        state: baseState, busy: false, error: null,
        onDismissError: noop, onCommands: noop, onEndTurn: noop,
      })),
    );

    expect(screen.queryByTestId('badge-toast')).not.toBeInTheDocument();

    act(() => {
      rerender(wrap(createElement(GameScreen, {
        state: stateWithRoute, busy: false, error: null,
        onDismissError: noop, onCommands: noop, onEndTurn: noop,
      })));
    });

    // Wait for the setTimeout(0) to fire and toast state update to render.
    await waitFor(
      () => {
        expect(screen.getByTestId('badge-toast')).toBeInTheDocument();
      },
      { timeout: 500 },
    );
  });

  it('does not show badge-toast if badge was already earned', () => {
    // Pre-populate the profile with the firstFlight badge already earned.
    mockProfileBadges = { firstFlight: '2026-01-01T00:00:00.000Z' };

    const { rerender } = render(
      wrap(createElement(GameScreen, {
        state: baseState, busy: false, error: null,
        onDismissError: noop, onCommands: noop, onEndTurn: noop,
      })),
    );

    act(() => {
      rerender(wrap(createElement(GameScreen, {
        state: stateWithRoute, busy: false, error: null,
        onDismissError: noop, onCommands: noop, onEndTurn: noop,
      })));
      jest.runAllTimers();
    });

    expect(screen.queryByTestId('badge-toast')).not.toBeInTheDocument();
  });
});
