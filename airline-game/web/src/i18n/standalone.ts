// Non-React standalone i18n helpers — safe to import from any TS file.
// No React, no 'use client' directive here.

import type { DictKeys } from './zh';
import zh from './zh';
import en from './en';
import es from './es';

export type Locale = 'zh' | 'en' | 'es';

const DICTS: Record<Locale, typeof zh> = { zh, en, es };

const LOCALE_STORAGE_KEY = 'skyempire.locale';
const DEFAULT_LOCALE: Locale = 'zh';

const interpolate = (template: string, params?: Record<string, string | number>): string => {
  if (!params) return template;
  return Object.entries(params).reduce<string>(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
};

export const tStandalone = (
  locale: Locale,
  key: DictKeys,
  params?: Record<string, string | number>,
): string => {
  const dict = DICTS[locale];
  const fallback = zh;
  const template = dict[key] ?? fallback[key] ?? key;
  return interpolate(template, params);
};

export const getLocale = (): Locale => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (raw === 'zh' || raw === 'en' || raw === 'es') return raw;
  return DEFAULT_LOCALE;
};
