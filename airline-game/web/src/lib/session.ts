// S1 会话失效兜底：判定一个错误是否意味着「服务端已无此游戏/房间」（404）。
// 命中时调用方应清掉本地会话键并回到开始页，而不是死在「Game not found」。
import { ApiError } from '@/services/api';

export const isSessionGoneError = (err: unknown): boolean =>
  err instanceof ApiError && err.status === 404;

export const clearKeys = (keys: readonly string[]): void => {
  if (typeof window === 'undefined') return;
  for (const key of keys) window.localStorage.removeItem(key);
};
