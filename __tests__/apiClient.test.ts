import { apiBaseUrl } from '@/services/apiClient';

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
