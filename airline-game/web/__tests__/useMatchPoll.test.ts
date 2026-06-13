/**
 * V3.3 — useMatchPoll: polls /api/matches/{code}?playerId, stops on finished,
 * pauses on tab-hidden.
 */
import { act, renderHook } from '@testing-library/react';
import { useMatchPoll } from '@/hooks/useMatchPoll';
import type { GameState, MatchView } from '@/types';

const gameStateFixture: GameState = {
  id: 'g-1',
  airlineName: '测试',
  hqCityId: 'nyc',
  turn: 1,
  year: 2026,
  quarter: 3,
  cash: 420_000_000,
  fleet: [],
  routes: [],
  competitors: [],
  marketShare: 0,
  slotMarket: {},
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

const makeMatchView = (overrides: Partial<MatchView> = {}): MatchView => ({
  code: 'TEST01',
  phase: 'active',
  turn: 1,
  year: 2026,
  quarter: 3,
  maxPlayers: 2,
  players: [
    { playerId: 'p1', name: '测试', hqCityId: 'nyc', ready: false, marketShare: 0, bankrupt: false },
  ],
  you: gameStateFixture,
  turnDeadlineMs: null,
  lastReport: null,
  finalStandings: null,
  ...overrides,
});

const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const jsonResponse = (body: unknown, ok = true): Response =>
  ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response;

describe('useMatchPoll — initial fetch', () => {
  it('fetches immediately on mount and returns view', async () => {
    const view = makeMatchView();
    mockFetch.mockResolvedValue(jsonResponse(view));

    const { result } = renderHook(() => useMatchPoll('TEST01', 'p1'));

    // Initially loading
    expect(result.current.view).toBeNull();

    // Wait for fetch to resolve
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.view?.code).toBe('TEST01');
    expect(result.current.loading).toBe(false);
  });

  it('does not fetch when code is null', async () => {
    renderHook(() => useMatchPoll(null, 'p1'));
    await act(async () => { await Promise.resolve(); });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not fetch when playerId is null', async () => {
    renderHook(() => useMatchPoll('TEST01', null));
    await act(async () => { await Promise.resolve(); });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('useMatchPoll — polling interval', () => {
  it('polls again after 2000ms', async () => {
    const view = makeMatchView();
    mockFetch.mockResolvedValue(jsonResponse(view));

    renderHook(() => useMatchPoll('TEST01', 'p1'));

    // Initial fetch
    await act(async () => { await Promise.resolve(); });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance 2 seconds
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('stops polling when phase becomes "finished"', async () => {
    // First response: active; second: finished
    const activeView = makeMatchView({ phase: 'active' });
    const finishedView = makeMatchView({
      phase: 'finished',
      finalStandings: [{ name: '测试', isPlayer: true, marketShare: 0.5 }],
    });

    mockFetch
      .mockResolvedValueOnce(jsonResponse(activeView))
      .mockResolvedValueOnce(jsonResponse(finishedView));

    renderHook(() => useMatchPoll('TEST01', 'p1'));

    // First poll
    await act(async () => { await Promise.resolve(); });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance to trigger second poll
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Third poll should NOT happen — phase is finished
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });
    expect(mockFetch).toHaveBeenCalledTimes(2); // still 2, no more polls
  });
});

describe('useMatchPoll — tab visibility', () => {
  it('pauses polling while tab is hidden and resumes when visible', async () => {
    const view = makeMatchView();
    mockFetch.mockResolvedValue(jsonResponse(view));

    renderHook(() => useMatchPoll('TEST01', 'p1'));

    // Initial fetch
    await act(async () => { await Promise.resolve(); });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Simulate tab hidden
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    // Advance timer — should NOT poll while hidden
    await act(async () => {
      jest.advanceTimersByTime(4000);
      await Promise.resolve();
    });
    expect(mockFetch).toHaveBeenCalledTimes(1); // no new polls

    // Simulate tab visible again
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      await Promise.resolve();
    });

    // Should immediately fetch on becoming visible
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe('useMatchPoll — error handling', () => {
  it('sets error when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMatchPoll('TEST01', 'p1'));

    await act(async () => { await Promise.resolve(); });

    expect(result.current.error).toBe('Network error');
    expect(result.current.view).toBeNull();
  });
});

describe('useMatchPoll — cleanup', () => {
  it('cleans up timer on unmount', async () => {
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');
    const view = makeMatchView();
    mockFetch.mockResolvedValue(jsonResponse(view));

    const { unmount } = renderHook(() => useMatchPoll('TEST01', 'p1'));
    await act(async () => { await Promise.resolve(); });

    unmount();

    // clearTimeout should have been called to clean up the pending poll
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
