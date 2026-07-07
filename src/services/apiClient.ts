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

/**
 * GET helper. Pass `revalidate` (seconds) to let Next.js cache the response
 * across requests — right for slow-moving reference data (schedule, cities,
 * teams). Omit it for per-user or must-be-fresh reads, which stay `no-store`.
 */
export const getJson = async <T>(
  path: string,
  revalidate?: number,
): Promise<T> => {
  const res = await fetch(
    `${apiBaseUrl()}${path}`,
    revalidate === undefined
      ? { cache: 'no-store' }
      : ({ next: { revalidate } } as RequestInit),
  );
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
