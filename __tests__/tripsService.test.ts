import { createTrip, listTrips } from '@/services/tripsService';

describe('tripsService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends the X-User-Id header and parses the response', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 't1',
          name: 'A',
          shareToken: 'x',
          itemCount: 0,
          totalUsd: 0,
          updatedAt: '',
        },
      ],
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const trips = await listTrips();
    expect(trips).toHaveLength(1);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers['X-User-Id']).toBeTruthy();
  });

  it('POSTs a new trip with the given name', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 't2', name: 'B' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const trip = await createTrip('B');
    expect(trip.id).toBe('t2');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain('/trips');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'B' });
  });

  it('throws on a non-ok response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(listTrips()).rejects.toThrow();
  });
});
