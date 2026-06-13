/**
 * V3.4 — Weekly API endpoint wrappers.
 */
import { getLeaderboard, getWeekly, startWeeklyGame } from '@/services/api';
import type { GameState, LeaderboardResponse, WeeklyChallenge } from '@/types';

const BASE = 'http://localhost:8001';

const WEEKLY_CHALLENGE: WeeklyChallenge = {
  weekId: '2026-W24',
  hqCityId: 'nyc',
  endsAtMs: 1_750_000_000_000,
};

const GAME_STATE: GameState = {
  id: 'wg-1',
  airlineName: '测试航空',
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
  seed: '2026-W24',
  weeklyWeekId: '2026-W24',
  playerToken: 'tok-abc123',
};

const LEADERBOARD: LeaderboardResponse = {
  weekId: '2026-W24',
  entries: [
    { rank: 1, name: '环球之翼', score: 9000, profit: 2_000_000_000, marketShare: 0.3 },
    { rank: 2, name: '测试航空', score: 7500, profit: 1_500_000_000, marketShare: 0.2, isYou: true },
  ],
};

const jsonResponse = (body: unknown, ok = true, status = 200): Response =>
  ({ ok, status, json: async () => body }) as Response;

const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe('getWeekly', () => {
  it('GETs /api/weekly and returns the WeeklyChallenge', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(WEEKLY_CHALLENGE));

    const result = await getWeekly();
    expect(result).toEqual(WEEKLY_CHALLENGE);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/weekly`, expect.any(Object));
  });
});

describe('startWeeklyGame', () => {
  it('POSTs airlineName to /api/weekly/games and returns GameState', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(GAME_STATE));

    const state = await startWeeklyGame('测试航空');
    expect(state).toEqual(GAME_STATE);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/weekly/games`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ airlineName: '测试航空' });
  });

  it('does not include hqCityId in the request body (backend derives from weekId)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(GAME_STATE));
    await startWeeklyGame('测试航空');

    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty('hqCityId');
  });
});

describe('getLeaderboard', () => {
  it('GETs /api/leaderboard without params when neither weekId nor token supplied', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(LEADERBOARD));

    await getLeaderboard();
    const [url] = mockFetch.mock.calls[0];
    expect(String(url)).toBe(`${BASE}/api/leaderboard`);
  });

  it('GETs /api/leaderboard?weekId=... when only weekId supplied', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(LEADERBOARD));

    await getLeaderboard('2026-W24');
    const [url] = mockFetch.mock.calls[0];
    expect(String(url)).toBe(`${BASE}/api/leaderboard?weekId=2026-W24`);
  });

  it('GETs /api/leaderboard?token=... when only token supplied', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(LEADERBOARD));

    await getLeaderboard(undefined, 'tok-abc');
    const [url] = mockFetch.mock.calls[0];
    expect(String(url)).toBe(`${BASE}/api/leaderboard?token=tok-abc`);
  });

  it('GETs /api/leaderboard?weekId=...&token=... when both supplied', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(LEADERBOARD));

    await getLeaderboard('2026-W24', 'tok-abc');
    const [url] = mockFetch.mock.calls[0];
    expect(String(url)).toBe(`${BASE}/api/leaderboard?weekId=2026-W24&token=tok-abc`);
  });

  it('returns entries with isYou flag correctly', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(LEADERBOARD));

    const res = await getLeaderboard('2026-W24');
    expect(res.entries).toHaveLength(2);
    expect(res.entries[0].isYou).toBeUndefined();
    expect(res.entries[1].isYou).toBe(true);
  });
});
