'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  createElement,
  type ReactNode,
} from 'react';
import type { DictKeys } from './zh';
import { tStandalone, getLocale as readLocale, type Locale } from './standalone';

// Re-export for convenience
export type { Locale };
export { tStandalone, readLocale as getLocale };

const DEFAULT_LOCALE: Locale = 'zh';

// ── Translation function ──────────────────────────────────────────────────────

const makeT =
  (locale: Locale) =>
  (key: DictKeys, params?: Record<string, string | number>): string =>
    tStandalone(locale, key, params);

// ── localStorage helpers ─────────────────────────────────────────────────────

const writeLocale = (locale: Locale): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('skyempire.locale', locale);
};

// ── Context ──────────────────────────────────────────────────────────────────

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictKeys, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
  t: makeT(DEFAULT_LOCALE),
});

// ── Provider ─────────────────────────────────────────────────────────────────

type I18nProviderProps = { children: ReactNode };

export const I18nProvider = ({ children }: I18nProviderProps): ReactNode => {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Hydrate from localStorage on mount (client only).
  useEffect(() => {
    setLocaleState(readLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    writeLocale(next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: DictKeys, params?: Record<string, string | number>) =>
      makeT(locale)(key, params),
    [locale],
  );

  return createElement(I18nContext.Provider, { value: { locale, setLocale, t } }, children);
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useT = (): I18nContextValue => useContext(I18nContext);

// Re-export key type so consumers don't need to import from zh.ts directly.
export type { DictKeys };
