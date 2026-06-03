import { checkoutTrip, listBookings } from '@/services/bookingsService';

describe('bookingsService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('POSTs a trip checkout with the identity header', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'b1', confirmationCode: 'WC-ABC123' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const booking = await checkoutTrip('t1');
    expect(booking.id).toBe('b1');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain('/trips/t1/checkout');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-User-Id']).toBeTruthy();
  });

  it('lists bookings', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'b1',
          tripName: 'A',
          status: 'reserved',
          confirmationCode: 'WC-1',
          totalUsd: 0,
          lineCount: 0,
          createdAt: '',
        },
      ],
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const bookings = await listBookings();
    expect(bookings).toHaveLength(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/bookings');
  });
});
