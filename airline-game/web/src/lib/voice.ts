// Original fictional voice cast using browser SpeechSynthesis.
// LEGAL: all characters are completely fictional — no real-person imitation.
// Characters:
//   金满堂 (董事长) — bombastic tycoon, pitch 0.7, rate 0.85
//   飞天妹 (市场总监) — hype energy, pitch 1.4, rate 1.25
//   云淡风 (首席顾问) — zen calm, pitch 1.0, rate 0.8
//
// V3.1: voice locale follows skyempire.locale; advisor display names are
// localized; TTS voice selected by lang tag (zh-CN / en-US / es-MX).

import type { TurnReport } from '@/types';
import { getLocale, tStandalone, type Locale } from '@/i18n/standalone';

const PREF_KEY = 'skyempire.voice';

type Advisor = {
  pitch: number;
  rate: number;
};

// Canonical advisor data — names come from the i18n dictionary at runtime.
const ADVISORS: readonly Advisor[] = [
  { pitch: 0.7, rate: 0.85 },   // 金满堂 — bombastic tycoon
  { pitch: 1.4, rate: 1.25 },   // 飞天妹 — hype energy
  { pitch: 1.0, rate: 0.8 },    // 云淡风 — zen calm
] as const;

let currentAdvisorIndex = 0;

const readPref = (): boolean => {
  if (typeof window === 'undefined') return true;
  return (window.localStorage.getItem(PREF_KEY) ?? 'on') !== 'off';
};

const writePref = (on: boolean): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
};

// Voice lang tags per locale, in priority order.
const VOICE_LANGS: Record<Locale, string[]> = {
  zh: ['zh-CN', 'zh-TW', 'zh'],
  en: ['en-US', 'en-GB', 'en'],
  es: ['es-MX', 'es-419', 'es-ES', 'es'],
};

const getVoice = (locale: Locale): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined') return null;
  const voices = window.speechSynthesis.getVoices();
  const preferred = VOICE_LANGS[locale];
  // Try exact matches first, then prefix matches.
  for (const tag of preferred) {
    const exact = voices.find((v) => v.lang === tag);
    if (exact) return exact;
  }
  for (const tag of preferred) {
    const prefix = voices.find((v) => v.lang.startsWith(tag.split('-')[0]));
    if (prefix) return prefix;
  }
  return voices.length > 0 ? voices[0] : null;
};

const speak = (text: string, advisor: Advisor, locale: Locale): void => {
  if (typeof window === 'undefined') return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.pitch = advisor.pitch;
  utter.rate = advisor.rate;
  const v = getVoice(locale);
  if (v) utter.voice = v;
  window.speechSynthesis.speak(utter);
};

const buildTurnLine = (report: TurnReport, advisorIdx: number, locale: Locale): string => {
  const { profit } = report.totals;
  const M = (Math.abs(profit) / 1_000_000).toFixed(1);
  const totalPax = report.routeStats.reduce((sum, r) => sum + r.pax, 0);
  const K = (totalPax / 1000).toFixed(0);
  const name = tStandalone(locale, `advisor.${advisorIdx}.name` as Parameters<typeof tStandalone>[1]);

  if (profit > 0) {
    return tStandalone(locale, 'voice.profit', { name, M, K });
  }
  if (profit < 0) {
    return tStandalone(locale, 'voice.loss', { name, M, K });
  }
  return tStandalone(locale, 'voice.breakeven', { name, K });
};

export const voice = {
  speakTurnReport(report: TurnReport, turn: number): void {
    if (typeof window === 'undefined') return;
    if (!readPref()) return;
    const idx = turn % 3;
    currentAdvisorIndex = idx;
    const advisor = ADVISORS[idx];
    const locale = getLocale();
    const line = buildTurnLine(report, idx, locale);
    speak(line, advisor, locale);
  },

  speakMajorEvent(headline: string): void {
    if (typeof window === 'undefined') return;
    if (!readPref()) return;
    const advisor = ADVISORS[currentAdvisorIndex];
    const locale = getLocale();
    const name = tStandalone(locale, `advisor.${currentAdvisorIndex}.name` as Parameters<typeof tStandalone>[1]);
    // Truncate headline to keep line concise.
    const short = headline.length > 20 ? headline.slice(0, 20) + '…' : headline;
    const line = tStandalone(locale, 'voice.event', { name, headline: short });
    speak(line, advisor, locale);
  },

  cancel(): void {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
  },

  isEnabled(): boolean {
    return readPref();
  },

  toggle(): void {
    const next = !readPref();
    writePref(next);
    if (!next) {
      this.cancel();
    }
  },
};
