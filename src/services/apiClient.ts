/**
 * Thin wrapper around the native fetch API for talking to the FastAPI backend.
 * No third-party HTTP client (no Axios) per project conventions.
 */
export const apiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
  // Accept a bare host (e.g. a platform's service-to-service reference) by
  // defaulting to https, and drop any trailing slash so callers pass "/paths".
  const withScheme = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
};

export const mocksEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export const getJson = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${apiBaseUrl()}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`GET ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
};

export const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`POST ${path} failed with status ${res.status}`);
  }
  return (await res.json()) as T;
};
