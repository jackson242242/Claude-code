import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  readonly type: string;
  readonly status: number;

  constructor(message: string, type: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.status = status;
  }
}

const getBaseUrl = (): string => {
  // EXPO_PUBLIC_* vars are string-inlined into the bundle at build time (web and
  // native). Render sets this from the API service host. Bare host -> https.
  const raw = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000").trim();
  if (raw && !raw.includes("://")) {
    return `https://${raw}`;
  }
  return raw;
};

/**
 * Native-fetch JSON helper. Maps the backend's {"error":{message,type}} shape
 * onto a thrown ApiError. No API keys ever live in the client.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "Network request failed",
      "network_error",
      0,
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let type = "api_error";
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body?.error?.message) {
        message = body.error.message;
        type = body.error.type ?? type;
      }
    } catch {
      // Non-JSON error body — keep the default message.
    }
    throw new ApiError(message, type, response.status);
  }

  return (await response.json()) as T;
}
