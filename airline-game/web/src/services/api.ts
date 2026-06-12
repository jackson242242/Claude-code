import type {
  Command,
  CommandsResponse,
  EndTurnResponse,
  GameState,
  Meta,
} from '@/types';

// airline-game/data is the source of truth; backend dev server runs on :8001.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export class ApiError extends Error {
  readonly type: string;
  readonly status: number;

  constructor(message: string, type: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}

type ErrorEnvelope = { error?: { message?: string; type?: string } };

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body as ErrorEnvelope | null)?.error;
    throw new ApiError(
      err?.message ?? `请求失败（HTTP ${res.status}）`,
      err?.type ?? 'http_error',
      res.status,
    );
  }
  return body as T;
};

export const getMeta = (): Promise<Meta> => request<Meta>('/api/meta');

export const createGame = (airlineName: string, hqCityId: string): Promise<GameState> =>
  request<GameState>('/api/games', {
    method: 'POST',
    body: JSON.stringify({ airlineName, hqCityId }),
  });

export const getGame = (gameId: string): Promise<GameState> =>
  request<GameState>(`/api/games/${gameId}`);

export const sendCommands = (gameId: string, commands: Command[]): Promise<CommandsResponse> =>
  request<CommandsResponse>(`/api/games/${gameId}/commands`, {
    method: 'POST',
    body: JSON.stringify({ commands }),
  });

export const endTurn = (gameId: string): Promise<EndTurnResponse> =>
  request<EndTurnResponse>(`/api/games/${gameId}/end-turn`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
