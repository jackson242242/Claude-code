import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, type Locale } from './messages';
import { isLocale } from './index';

export const LOCALE_COOKIE = 'locale';

/** Reads the active locale from the request cookie (server components). */
export const getLocale = async (): Promise<Locale> => {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
};
