const USER_ID_KEY = 'wc2026:userId';

const generateId = (): string => {
  const cryptoObj =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID().replace(/-/g, '');
  }
  return `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Returns this browser's opaque user id, creating and persisting one in
 * localStorage on first use. Returns an empty string during SSR.
 */
export const getUserId = (): string => {
  if (typeof window === 'undefined') return '';
  let id = window.localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = generateId();
    window.localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
};
