import { apiBaseUrl } from './apiClient';
import { getUserId } from './userClient';

/**
 * Fetch wrapper for user-scoped endpoints (trips, bookings). Adds the opaque
 * X-User-Id identity header and parses JSON, throwing on non-2xx responses.
 */
export const authedFetch = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
};
