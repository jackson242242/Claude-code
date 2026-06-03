import {
  DEFAULT_LOCALE,
  LOCALES,
  MESSAGES,
  type Locale,
  type MessageKey,
} from './messages';

export { DEFAULT_LOCALE, LOCALES } from './messages';
export type { Locale, MessageKey } from './messages';

export const isLocale = (value: string | undefined | null): value is Locale =>
  value != null && (LOCALES as readonly string[]).includes(value);

export const getDictionary = (locale: Locale): Record<MessageKey, string> =>
  MESSAGES[locale];

export const translate = (locale: Locale, key: MessageKey): string =>
  MESSAGES[locale][key] ?? MESSAGES[DEFAULT_LOCALE][key];

/** Returns a bound translator for a locale. */
export const translator =
  (locale: Locale) =>
  (key: MessageKey): string =>
    translate(locale, key);
