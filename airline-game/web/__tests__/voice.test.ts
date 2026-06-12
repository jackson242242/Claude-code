/**
 * voice.ts — unit tests for the fictional advisor voice engine.
 * Stubs window.speechSynthesis and SpeechSynthesisUtterance.
 */

// --------------------------------------------------------------------------
// SpeechSynthesis + SpeechSynthesisUtterance mocks
// --------------------------------------------------------------------------

const mockSpeak = jest.fn();
const mockCancel = jest.fn();
const mockGetVoices = jest.fn().mockReturnValue([]);

Object.defineProperty(globalThis, 'speechSynthesis', {
  writable: true,
  configurable: true,
  value: {
    speak: mockSpeak,
    cancel: mockCancel,
    getVoices: mockGetVoices,
  },
});

// Track the last utterance created for inspection.
let lastUtterance: { text: string; pitch?: number; rate?: number; voice?: SpeechSynthesisVoice | null } | null = null;

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

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

import type { TurnReport } from '@/types';

const makeProfitReport = (profit: number, pax = 5000): TurnReport => ({
  turn: 1,
  year: 2026,
  quarter: 3,
  routeStats: [
    {
      routeId: 'rt-1',
      pax,
      capacity: 10000,
      loadFactor: 0.5,
      revenue: profit > 0 ? profit + 1_000_000 : 1_000_000,
      cost: profit > 0 ? 1_000_000 : Math.abs(profit) + 1_000_000,
      profit,
      classes: {
        economy: { pax, capacity: 10000, revenue: profit > 0 ? profit : 0 },
        business: { pax: 0, capacity: 0, revenue: 0 },
        first: { pax: 0, capacity: 0, revenue: 0 },
      },
    },
  ],
  totals: { revenue: 5_000_000, cost: profit > 0 ? 5_000_000 - profit : 5_000_000 + Math.abs(profit), profit },
  news: [],
});

// --------------------------------------------------------------------------

describe('voice module', () => {
  let voice: typeof import('@/lib/voice').voice;

  beforeEach(() => {
    mockSpeak.mockClear();
    mockCancel.mockClear();
    lastUtterance = null;
    window.localStorage.clear();

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });
  });

  // ---- enabled/disabled ---------------------------------------------------

  it('speakTurnReport when enabled: calls speechSynthesis.speak', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakTurnReport(makeProfitReport(2_000_000), 0);
    expect(mockSpeak).toHaveBeenCalledTimes(1);
  });

  it('speakTurnReport when muted (isEnabled false): does NOT call speak', () => {
    window.localStorage.setItem('skyempire.voice', 'off');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakTurnReport(makeProfitReport(2_000_000), 0);
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  // ---- advisor rotation ---------------------------------------------------

  it('advisor 0 (金满堂) for turn 0', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakTurnReport(makeProfitReport(1_000_000), 0);
    expect(lastUtterance?.text).toContain('金满堂');
  });

  it('advisor 1 (飞天妹) for turn 1', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakTurnReport(makeProfitReport(1_000_000), 1);
    expect(lastUtterance?.text).toContain('飞天妹');
  });

  it('advisor 2 (云淡风) for turn 2', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakTurnReport(makeProfitReport(1_000_000), 2);
    expect(lastUtterance?.text).toContain('云淡风');
  });

  it('advisor wraps: turn 3 → advisor 0 (金满堂)', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakTurnReport(makeProfitReport(1_000_000), 3);
    expect(lastUtterance?.text).toContain('金满堂');
  });

  // ---- content sanity -----------------------------------------------------

  it('profit > 0 line contains profit-positive phrasing', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakTurnReport(makeProfitReport(2_000_000), 0);
    // Should mention profit and positive word
    expect(lastUtterance?.text).toContain('盈利');
  });

  it('profit < 0 line contains loss phrasing', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakTurnReport(makeProfitReport(-2_000_000), 1);
    expect(lastUtterance?.text).toContain('亏损');
  });

  // ---- speakMajorEvent ----------------------------------------------------

  it('speakMajorEvent calls speak when enabled', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakMajorEvent('燃油价格飙升');
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    expect(lastUtterance?.text).toContain('留意事件');
  });

  it('speakMajorEvent does NOT call speak when disabled', () => {
    window.localStorage.setItem('skyempire.voice', 'off');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.speakMajorEvent('燃油价格飙升');
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  // ---- toggle -------------------------------------------------------------

  it('toggle() flips isEnabled() from on to off', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    expect(voice.isEnabled()).toBe(true);
    voice.toggle();
    expect(voice.isEnabled()).toBe(false);
  });

  it('toggle() flips isEnabled() from off to on', () => {
    window.localStorage.setItem('skyempire.voice', 'off');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    expect(voice.isEnabled()).toBe(false);
    voice.toggle();
    expect(voice.isEnabled()).toBe(true);
  });

  it('toggle() persists preference to localStorage', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.toggle(); // on → off
    expect(window.localStorage.getItem('skyempire.voice')).toBe('off');
    voice.toggle(); // off → on
    expect(window.localStorage.getItem('skyempire.voice')).toBe('on');
  });

  it('toggle() to off calls cancel()', () => {
    window.localStorage.setItem('skyempire.voice', 'on');
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.toggle(); // mute
    expect(mockCancel).toHaveBeenCalled();
  });

  // ---- cancel -------------------------------------------------------------

  it('cancel() calls speechSynthesis.cancel()', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    voice.cancel();
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  // ---- default pref -------------------------------------------------------

  it('isEnabled() defaults to true when no pref set', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      voice = require('@/lib/voice').voice as typeof import('@/lib/voice').voice;
    });

    expect(voice.isEnabled()).toBe(true);
  });
});
