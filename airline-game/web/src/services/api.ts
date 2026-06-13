import type {
  Command,
  CommandsResponse,
  CreateMatchResponse,
  EndTurnResponse,
  GameState,
  JoinMatchResponse,
  LeaderboardResponse,
  MatchCommandsResponse,
  MatchView,
  Meta,
  WeeklyChallenge,
} from '@/types';

// airline-game/data is the source of truth; backend dev server runs on :8001.
// 容错两种注入形态：裸主机名（补 https://）和 Render fromService 的内部短名
// （无点、非 localhost，补 .onrender.com——线上实测它只给 "skyempire-api"）。
const rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const withProto = rawBase.startsWith('http') ? rawBase : `https://${rawBase}`;
const bareHost = withProto.replace(/^https?:\/\//, '').split('/')[0];
const API_BASE =
  bareHost.includes('.') || bareHost.startsWith('localhost')
    ? withProto
    : `${withProto}.onrender.com`;

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

// ── V3.3 Multiplayer match endpoints ──────────────────────────────────────────

export const createMatch = (
  hostName: string,
  hostHqCityId: string,
  maxPlayers: 2 | 3 | 4,
  fillWithAI: boolean,
): Promise<CreateMatchResponse> =>
  request<CreateMatchResponse>('/api/matches', {
    method: 'POST',
    body: JSON.stringify({ hostName, hostHqCityId, maxPlayers, fillWithAI }),
  });

export const joinMatch = (
  code: string,
  name: string,
  hqCityId: string,
): Promise<JoinMatchResponse> =>
  request<JoinMatchResponse>(`/api/matches/${code}/join`, {
    method: 'POST',
    body: JSON.stringify({ name, hqCityId }),
  });

export const startMatch = (code: string, playerId: string): Promise<MatchView> =>
  request<MatchView>(`/api/matches/${code}/start`, {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  });

export const getMatch = (code: string, playerId: string): Promise<MatchView> =>
  request<MatchView>(`/api/matches/${code}?playerId=${encodeURIComponent(playerId)}`);

export const sendMatchCommands = (
  code: string,
  playerId: string,
  commands: Command[],
): Promise<MatchCommandsResponse> =>
  request<MatchCommandsResponse>(`/api/matches/${code}/commands`, {
    method: 'POST',
    body: JSON.stringify({ playerId, commands }),
  });

export const readyMatch = (code: string, playerId: string): Promise<MatchView> =>
  request<MatchView>(`/api/matches/${code}/ready`, {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  });

// ── V3.4 Weekly challenge & leaderboard endpoints ──────────────────────────────

export const getWeekly = (): Promise<WeeklyChallenge> =>
  request<WeeklyChallenge>('/api/weekly');

export const startWeeklyGame = (airlineName: string): Promise<GameState> =>
  request<GameState>('/api/weekly/games', {
    method: 'POST',
    body: JSON.stringify({ airlineName }),
  });

export const getLeaderboard = (weekId?: string, token?: string): Promise<LeaderboardResponse> => {
  const params = new URLSearchParams();
  if (weekId) params.set('weekId', weekId);
  if (token) params.set('token', token);
  const qs = params.toString();
  return request<LeaderboardResponse>(`/api/leaderboard${qs ? `?${qs}` : ''}`);
};
