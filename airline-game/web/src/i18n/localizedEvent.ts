// Helpers for localizing GameEvent headline/detail by locale.
// CONTRACT §0 V3.1: en → headlineEn ?? headline; es → headlineEs ?? headline.
// Also handles kind:"system" NewsItem template localization for AI route openings.

import type { GameEvent, NewsItem } from '@/types';
import type { Locale } from './standalone';

// ── GameEvent field localization ─────────────────────────────────────────────

export const localizedHeadline = (event: GameEvent, locale: Locale): string => {
  if (locale === 'en') return event.headlineEn ?? event.headline;
  if (locale === 'es') return event.headlineEs ?? event.headline;
  return event.headline;
};

export const localizedDetail = (event: GameEvent, locale: Locale): string | undefined => {
  if (locale === 'en') return event.detailEn ?? event.detail;
  if (locale === 'es') return event.detailEs ?? event.detail;
  return event.detail;
};

// ── kind:"system" NewsItem template matching ─────────────────────────────────
// Known Chinese template: "{航司名} 开通 {城市A} — {城市B} 航线"
// We regex-match and re-render via dictionary keys for en/es.

// Each known template pattern maps to a lookup key and a param extractor.
type Template = {
  regex: RegExp;
  // Returns null if match fails (should not happen if regex matched).
  buildParams: (match: RegExpMatchArray) => Record<string, string> | null;
  enKey: string;
  esKey: string;
};

// We add en/es keys for system news templates to the dictionaries (below).
// Template: "{name} 开通 {cityA} — {cityB} 航线"
const SYSTEM_TEMPLATES: Template[] = [
  {
    // Matches: "极光太平洋航空 开通 东京 — 新加坡 航线"
    regex: /^(.+?) 开通 (.+?) [—–-] (.+?) 航线$/,
    buildParams: (match) => ({
      airline: match[1],
      cityA: match[2],
      cityB: match[3],
    }),
    enKey: 'system.routeOpen.en',
    esKey: 'system.routeOpen.es',
  },
];

// We extend the Dict to include these runtime-only template strings.
// They are added here as standalone constants (not in zh.ts to avoid polluting
// the typed Dict with keys not in all dicts).
const SYSTEM_EN: Record<string, string> = {
  'system.routeOpen.en': '{airline} opens new route {cityA} — {cityB}',
};

const SYSTEM_ES: Record<string, string> = {
  'system.routeOpen.es': '{airline} abre nueva ruta {cityA} — {cityB}',
};

const interpolate = (template: string, params: Record<string, string>): string =>
  Object.entries(params).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, v), template);

/**
 * Localize a kind:"system" NewsItem headline.
 * Returns the localized string if a known template matches, or the original headline.
 */
export const localizedSystemHeadline = (item: NewsItem, locale: Locale): string => {
  if (locale === 'zh') return item.headline;

  for (const tmpl of SYSTEM_TEMPLATES) {
    const match = item.headline.match(tmpl.regex);
    if (match) {
      const params = tmpl.buildParams(match);
      if (!params) continue;
      if (locale === 'en') {
        const template = SYSTEM_EN[tmpl.enKey];
        if (template) return interpolate(template, params);
      }
      if (locale === 'es') {
        const template = SYSTEM_ES[tmpl.esKey];
        if (template) return interpolate(template, params);
      }
    }
  }

  // No match — return original (as-is per CONTRACT)
  return item.headline;
};

/**
 * Localize any NewsItem headline by kind.
 * - kind:"event" → use kind-level fields (none in NewsItem, show as-is)
 * - kind:"system" → template-match localization
 */
export const localizedNewsHeadline = (item: NewsItem, locale: Locale): string => {
  if (item.kind === 'system') return localizedSystemHeadline(item, locale);
  // kind:"event" items have no extra fields in NewsItem; show as-is
  return item.headline;
};

