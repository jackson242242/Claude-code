import { ApiError, createGame, endTurn, getGame, getMeta, sendCommands } from '@/services/api';
import type { Command, GameState } from '@/types';

const BASE = 'http://localhost:8001';

const gameStateFixture: GameState = {
  id: 'g-1',
  airlineName: '环球之翼',
  hqCityId: 'nyc',
  turn: 1,
  year: 2026,
  quarter: 3,
  cash: 420_000_000,
  fleet: [],
  routes: [],
  competitors: [],
  marketShare: 0,
  slotMarket: { nyc: { capacity: 12, taken: 2, playerHeld: 2, playerUsed: 0 } },
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

const jsonResponse = (body: unknown, ok = true, status = 200): Response =>
  ({ ok, status, json: async () => body }) as Response;

const mockFetch = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe('api service', () => {
  it('getMeta GETs /api/meta and returns the payload', async () => {
    const meta = { cities: [], aircraftModels: [] };
    mockFetch.mockResolvedValueOnce(jsonResponse(meta));

    await expect(getMeta()).resolves.toEqual(meta);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/meta`, expect.any(Object));
  });

  it('createGame POSTs airlineName + hqCityId and returns the GameState', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(gameStateFixture, true, 201));

    const state = await createGame('环球之翼', 'nyc');

    expect(state).toEqual(gameStateFixture);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/games`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ airlineName: '环球之翼', hqCityId: 'nyc' });
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('getGame GETs /api/games/{id}', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(gameStateFixture));

    await expect(getGame('g-1')).resolves.toEqual(gameStateFixture);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/api/games/g-1`, expect.any(Object));
  });

  it('sendCommands POSTs the command batch and returns state + results', async () => {
    const commands: Command[] = [
      { type: 'buyAircraft', modelId: 'a320neo' },
      { type: 'openRoute', cityA: 'nyc', cityB: 'lhr' },
    ];
    const payload = {
      state: gameStateFixture,
      results: [
        { index: 0, ok: true },
        { index: 1, ok: false, message: '现金不足' },
      ],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));

    const response = await sendCommands('g-1', commands);

    expect(response).toEqual(payload);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/games/g-1/commands`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ commands });
  });

  it('endTurn POSTs an empty object and returns state + report', async () => {
    const payload = {
      state: gameStateFixture,
      report: {
        turn: 1,
        year: 2026,
        quarter: 3,
        routeStats: [],
        totals: { revenue: 0, cost: 0, profit: 0 },
        news: [],
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));

    const response = await endTurn('g-1');

    expect(response).toEqual(payload);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE}/api/games/g-1/end-turn`);
    expect(init?.method).toBe('POST');
    expect(String(init?.body)).toBe('{}');
  });

  it('throws an ApiError carrying message/type from the error envelope', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: { message: '现金不足', type: 'invalid_command' } }, false, 400),
    );

    const rejection = await getGame('g-1').then(
      () => {
        throw new Error('expected rejection');
      },
      (err: unknown) => err,
    );

    expect(rejection).toBeInstanceOf(ApiError);
    expect(rejection).toMatchObject({
      message: '现金不足',
      type: 'invalid_command',
      status: 400,
    });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);

    await expect(getGame('g-1')).rejects.toMatchObject({ type: 'http_error', status: 500 });
  });
});
