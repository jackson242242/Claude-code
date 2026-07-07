import { apiBaseUrl, getJson } from '@/services/apiClient';

describe('apiBaseUrl', () => {
  const original = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = original;
  });

  it('defaults to the local backend when unset', () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    expect(apiBaseUrl()).toBe('http://localhost:8000');
  });

  it('passes a full URL through and strips a trailing slash', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com/';
    expect(apiBaseUrl()).toBe('https://api.example.com');
  });

  it('prepends https:// to a bare host (e.g. a Render service host)', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'worldcup-api.onrender.com';
    expect(apiBaseUrl()).toBe('https://worldcup-api.onrender.com');
  });
});

describe('getJson caching', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('stays uncached (no-store) by default', async () => {
    await getJson('/trips');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/trips'), {
      cache: 'no-store',
    });
  });

  it('opts into the Next.js data cache when revalidate is given', async () => {
    await getJson('/cities', 3600);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/cities'), {
      next: { revalidate: 3600 },
    });
  });
});
