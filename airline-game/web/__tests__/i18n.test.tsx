/**
 * V3.1 i18n tests:
 * 1. Locale switch re-renders strings (zh→en on a couple of components)
 * 2. localizedHeadline fallback logic
 * 3. system-news template localization (matched + unmatched)
 * 4. Locale persistence (localStorage)
 * 5. Voice locale selection (stubbed speechSynthesis voices)
 */

// ── SpeechSynthesis stubs (needed for voice.ts import) ────────────────────────

const mockSpeak = jest.fn();
const mockCancel = jest.fn();
const mockGetVoices = jest.fn().mockReturnValue([]);

Object.defineProperty(globalThis, 'speechSynthesis', {
  writable: true,
  configurable: true,
  value: { speak: mockSpeak, cancel: mockCancel, getVoices: mockGetVoices },
});

let lastUtterance: { text: string; voice?: SpeechSynthesisVoice | null } | null = null;

class MockSpeechSynthesisUtterance {
  text: string;
  pitch?: number;
  rate?: number;
  voice: SpeechSynthesisVoice | null = null;
  constructor(text: string) {
    this.text = text;
    lastUtterance = this;
  }
}

Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
  writable: true,
  configurable: true,
  value: MockSpeechSynthesisUtterance,
});

// ── React imports ─────────────────────────────────────────────────────────────

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { I18nProvider, useT } from '@/i18n';
import { localizedHeadline, localizedDetail, localizedSystemHeadline } from '@/i18n/localizedEvent';
import type { GameEvent, NewsItem } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeEvent = (overrides: Partial<GameEvent> = {}): GameEvent => ({
  id: 'evt-test',
  source: 'static',
  headline: '燃油价格飙升',
  scope: { kind: 'global', ids: [] },
  effects: [{ target: 'fuelCost', mult: 1.4 }],
  durationTurns: 3,
  severity: 'major',
  ...overrides,
});

// Minimal component that renders a translated string and exposes locale switch.
const TestComp = () => {
  const { t, locale, setLocale } = useT();
  return (
    <div>
      <span data-testid="str">{t('start.btn.create')}</span>
      <span data-testid="cash-label">{t('topbar.cash')}</span>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale('en')} data-testid="set-en">EN</button>
      <button onClick={() => setLocale('es')} data-testid="set-es">ES</button>
      <button onClick={() => setLocale('zh')} data-testid="set-zh">ZH</button>
    </div>
  );
};

const wrap = (node: React.ReactNode) =>
  createElement(I18nProvider, null, node);

// ── 1. Locale switch re-renders strings ───────────────────────────────────────

describe('Locale switch', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to zh', () => {
    render(wrap(createElement(TestComp)));
    expect(screen.getByTestId('locale')).toHaveTextContent('zh');
    expect(screen.getByTestId('str')).toHaveTextContent('成立航空公司 ✈');
    expect(screen.getByTestId('cash-label')).toHaveTextContent('现金');
  });

  it('switching to en renders English strings', async () => {
    const user = userEvent.setup();
    render(wrap(createElement(TestComp)));

    await user.click(screen.getByTestId('set-en'));

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('str')).toHaveTextContent('Found Airline ✈');
    expect(screen.getByTestId('cash-label')).toHaveTextContent('Cash');
  });

  it('switching to es renders Spanish strings', async () => {
    const user = userEvent.setup();
    render(wrap(createElement(TestComp)));

    await user.click(screen.getByTestId('set-es'));

    expect(screen.getByTestId('locale')).toHaveTextContent('es');
    expect(screen.getByTestId('str')).toHaveTextContent('Fundar aerolínea ✈');
    expect(screen.getByTestId('cash-label')).toHaveTextContent('Efectivo');
  });

  it('switching en then back to zh restores Chinese', async () => {
    const user = userEvent.setup();
    render(wrap(createElement(TestComp)));

    await user.click(screen.getByTestId('set-en'));
    await user.click(screen.getByTestId('set-zh'));

    expect(screen.getByTestId('str')).toHaveTextContent('成立航空公司 ✈');
  });
});

// ── 2. Locale persistence ─────────────────────────────────────────────────────

describe('Locale persistence', () => {
  beforeEach(() => window.localStorage.clear());

  it('persists locale to localStorage on switch', async () => {
    const user = userEvent.setup();
    render(wrap(createElement(TestComp)));

    await user.click(screen.getByTestId('set-en'));
    expect(window.localStorage.getItem('skyempire.locale')).toBe('en');
  });

  it('restores locale from localStorage on mount', () => {
    window.localStorage.setItem('skyempire.locale', 'es');
    render(wrap(createElement(TestComp)));
    // After the useEffect runs (hydration), locale should be es.
    expect(screen.getByTestId('locale')).toHaveTextContent('es');
  });

  it('defaults to zh when localStorage has invalid value', () => {
    window.localStorage.setItem('skyempire.locale', 'fr');
    render(wrap(createElement(TestComp)));
    // Should fall back to default zh (after hydration effect).
    // The component starts with zh server default, so initial render is zh.
    expect(screen.getByTestId('str')).toHaveTextContent('成立航空公司 ✈');
  });
});

// ── 3. localizedHeadline fallback ─────────────────────────────────────────────

describe('localizedHeadline', () => {
  it('zh locale returns headline', () => {
    const event = makeEvent({ headline: '燃油价格飙升', headlineEn: 'Fuel spike' });
    expect(localizedHeadline(event, 'zh')).toBe('燃油价格飙升');
  });

  it('en locale returns headlineEn when present', () => {
    const event = makeEvent({ headline: '燃油价格飙升', headlineEn: 'Fuel spike' });
    expect(localizedHeadline(event, 'en')).toBe('Fuel spike');
  });

  it('en locale falls back to headline when headlineEn missing', () => {
    const event = makeEvent({ headline: '燃油价格飙升' });
    expect(localizedHeadline(event, 'en')).toBe('燃油价格飙升');
  });

  it('es locale returns headlineEs when present', () => {
    const event = makeEvent({ headline: '燃油价格飙升', headlineEs: 'Alza del combustible' });
    expect(localizedHeadline(event, 'es')).toBe('Alza del combustible');
  });

  it('es locale falls back to headline when headlineEs missing', () => {
    const event = makeEvent({ headline: '燃油价格飙升' });
    expect(localizedHeadline(event, 'es')).toBe('燃油价格飙升');
  });

  it('localizedDetail en falls back to detail when detailEn missing', () => {
    const event = makeEvent({ detail: '详细信息' });
    expect(localizedDetail(event, 'en')).toBe('详细信息');
  });

  it('localizedDetail en returns detailEn when present', () => {
    const event = makeEvent({ detail: '详细信息', detailEn: 'Detail info' });
    expect(localizedDetail(event, 'en')).toBe('Detail info');
  });
});

// ── 4. System news template localization ──────────────────────────────────────

describe('localizedSystemHeadline', () => {
  const makeSystemItem = (headline: string): NewsItem => ({
    headline,
    kind: 'system',
  });

  it('zh locale returns original Chinese headline unchanged', () => {
    const item = makeSystemItem('极光太平洋航空 开通 东京 — 新加坡 航线');
    expect(localizedSystemHeadline(item, 'zh')).toBe('极光太平洋航空 开通 东京 — 新加坡 航线');
  });

  it('en locale matches known template and localizes', () => {
    const item = makeSystemItem('极光太平洋航空 开通 东京 — 新加坡 航线');
    const result = localizedSystemHeadline(item, 'en');
    expect(result).toContain('极光太平洋航空');
    expect(result).toContain('opens new route');
    expect(result).toContain('东京');
    expect(result).toContain('新加坡');
  });

  it('es locale matches known template and localizes', () => {
    const item = makeSystemItem('皇家子午线航空 开通 伦敦 — 迪拜 航线');
    const result = localizedSystemHeadline(item, 'es');
    expect(result).toContain('abre nueva ruta');
    expect(result).toContain('皇家子午线航空');
    expect(result).toContain('伦敦');
    expect(result).toContain('迪拜');
  });

  it('unmatched pattern returns headline as-is for en', () => {
    const item = makeSystemItem('系统已重置');
    expect(localizedSystemHeadline(item, 'en')).toBe('系统已重置');
  });

  it('unmatched pattern returns headline as-is for es', () => {
    const item = makeSystemItem('系统已重置');
    expect(localizedSystemHeadline(item, 'es')).toBe('系统已重置');
  });
});

// ── 5. Voice locale voice selection ──────────────────────────────────────────

describe('voice locale selection', () => {
  const makeReport = (profit: number) => ({
    turn: 1,
    year: 2026,
    quarter: 3 as const,
    routeStats: [
      {
        routeId: 'rt-1',
        pax: 5000,
        capacity: 10000,
        loadFactor: 0.5,
        revenue: 5_000_000,
        cost: 5_000_000 - profit,
        profit,
        classes: {
          economy: { pax: 5000, capacity: 10000, revenue: profit },
          business: { pax: 0, capacity: 0, revenue: 0 },
          first: { pax: 0, capacity: 0, revenue: 0 },
        },
      },
    ],
    totals: { revenue: 5_000_000, cost: 5_000_000 - profit, profit },
    news: [],
  });

  beforeEach(() => {
    mockSpeak.mockClear();
    lastUtterance = null;
    window.localStorage.setItem('skyempire.voice', 'on');
  });

  it('zh locale selects zh-CN voice from available voices', () => {
    const zhVoice = { lang: 'zh-CN', name: 'ZH Voice' } as SpeechSynthesisVoice;
    const enVoice = { lang: 'en-US', name: 'EN Voice' } as SpeechSynthesisVoice;
    mockGetVoices.mockReturnValue([zhVoice, enVoice]);
    window.localStorage.setItem('skyempire.locale', 'zh');

    let voice: typeof import('@/lib/voice').voice;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice!.speakTurnReport(makeReport(1_000_000), 0);
    expect(lastUtterance?.voice).toBe(zhVoice);
  });

  it('en locale selects en-US voice from available voices', () => {
    const zhVoice = { lang: 'zh-CN', name: 'ZH Voice' } as SpeechSynthesisVoice;
    const enVoice = { lang: 'en-US', name: 'EN Voice' } as SpeechSynthesisVoice;
    mockGetVoices.mockReturnValue([zhVoice, enVoice]);
    window.localStorage.setItem('skyempire.locale', 'en');

    let voice: typeof import('@/lib/voice').voice;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice!.speakTurnReport(makeReport(1_000_000), 0);
    expect(lastUtterance?.voice).toBe(enVoice);
  });

  it('es locale selects es-MX voice from available voices', () => {
    const esVoice = { lang: 'es-MX', name: 'ES Voice' } as SpeechSynthesisVoice;
    const enVoice = { lang: 'en-US', name: 'EN Voice' } as SpeechSynthesisVoice;
    mockGetVoices.mockReturnValue([esVoice, enVoice]);
    window.localStorage.setItem('skyempire.locale', 'es');

    let voice: typeof import('@/lib/voice').voice;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice!.speakTurnReport(makeReport(1_000_000), 0);
    expect(lastUtterance?.voice).toBe(esVoice);
  });

  it('en locale generates English voice line', () => {
    mockGetVoices.mockReturnValue([]);
    window.localStorage.setItem('skyempire.locale', 'en');

    let voice: typeof import('@/lib/voice').voice;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice!.speakTurnReport(makeReport(2_000_000), 0);
    expect(lastUtterance?.text).toContain('says:');
  });

  it('zh locale generates Chinese voice line with advisor name 金满堂', () => {
    mockGetVoices.mockReturnValue([]);
    window.localStorage.setItem('skyempire.locale', 'zh');

    let voice: typeof import('@/lib/voice').voice;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice!.speakTurnReport(makeReport(1_000_000), 0);
    expect(lastUtterance?.text).toContain('金满堂');
  });
});
