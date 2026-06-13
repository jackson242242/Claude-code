/**
 * V3.3 — Match API service tests.
 * Tests createMatch, joinMatch, startMatch, getMatch, sendMatchCommands, readyMatch.
 */
import {
  createMatch,
  joinMatch,
  startMatch,
  getMatch,
  sendMatchCommands,
  readyMatch,
} from '@/services/api';
import type { Command, GameState, MatchView } from '@/types';

const BASE = 'http://localhost:8001';

const gameStateFixture: GameState = {
  id: 'g-1',
  airlineName: '多人测试',
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

const makeMatchView = (
  overrides: Partial<MatchView> = {},
): MatchView => ({
  code: 'ABC123',
  phase: 'lobby',
  turn: 1,
  year: 2026,
  quarter: 3,
  maxPlayers: 2,
  players: [
    { playerId: 'p1', name: '测试航空', hqCityId: 'nyc', ready: false, marketShare: 0, bankrupt: false },
  ],
  you: gameStateFixture,
  turnDeadlineMs: null,
  lastReport: null,
  finalStandings: null,
  ...overrides,
});

const jsonResponse = (body: unknown, ok = true, status = 200): Response =>
  ({ ok, status, json: async () => body }) as Response;

const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe('createMatch', () => {
  it('POSTs to /api/matches with host params', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ code: 'ABC123', playerId: 'p1' }, true, 201));

    const result = await createMatch('测试航空', 'nyc', 2, true);

    expect(result).toEqual({ code: 'ABC123', playerId: 'p1' });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/matches`);
    expect(init?.method).toBe('POST');
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({
      hostName: '测试航空',
      hostHqCityId: 'nyc',
      maxPlayers: 2,
      fillWithAI: true,
    });
  });
});

describe('joinMatch', () => {
  it('POSTs to /api/matches/{code}/join', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ playerId: 'p2' }));

    const result = await joinMatch('ABC123', '挑战者', 'lhr');

    expect(result).toEqual({ playerId: 'p2' });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/matches/ABC123/join`);
    expect(init?.method).toBe('POST');
    const body = JSON.parse(String(init?.body));
    expect(body).toEqual({ name: '挑战者', hqCityId: 'lhr' });
  });
});

describe('startMatch', () => {
  it('POSTs to /api/matches/{code}/start with playerId', async () => {
    const view = makeMatchView({ phase: 'active' });
    mockFetch.mockResolvedValueOnce(jsonResponse(view));

    const result = await startMatch('ABC123', 'p1');

    expect(result.phase).toBe('active');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/matches/ABC123/start`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ playerId: 'p1' });
  });
});

describe('getMatch', () => {
  it('GETs /api/matches/{code}?playerId=...', async () => {
    const view = makeMatchView();
    mockFetch.mockResolvedValueOnce(jsonResponse(view));

    const result = await getMatch('ABC123', 'p1');

    expect(result.code).toBe('ABC123');
    const [url] = mockFetch.mock.calls[0];
    expect(String(url)).toBe(`${BASE}/api/matches/ABC123?playerId=p1`);
  });

  it('URL-encodes the playerId', async () => {
    const view = makeMatchView();
    mockFetch.mockResolvedValueOnce(jsonResponse(view));

    await getMatch('ABC123', 'player with spaces');

    const [url] = mockFetch.mock.calls[0];
    expect(String(url)).toBe(`${BASE}/api/matches/ABC123?playerId=player%20with%20spaces`);
  });
});

describe('sendMatchCommands', () => {
  it('POSTs commands to /api/matches/{code}/commands', async () => {
    const commands: Command[] = [{ type: 'buyAircraft', modelId: 'a320neo' }];
    const responsePayload = {
      view: makeMatchView({ phase: 'active' }),
      results: [{ index: 0, ok: true }],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(responsePayload));

    const result = await sendMatchCommands('ABC123', 'p1', commands);

    expect(result.results[0].ok).toBe(true);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/matches/ABC123/commands`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ playerId: 'p1', commands });
  });
});

describe('readyMatch', () => {
  it('POSTs to /api/matches/{code}/ready with playerId', async () => {
    const view = makeMatchView({ phase: 'active' });
    mockFetch.mockResolvedValueOnce(jsonResponse(view));

    const result = await readyMatch('ABC123', 'p1');

    expect(result.code).toBe('ABC123');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/matches/ABC123/ready`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ playerId: 'p1' });
  });
});
