// Original fictional voice cast using browser SpeechSynthesis.
// LEGAL: all characters are completely fictional — no real-person imitation.
// Characters:
//   金满堂 (董事长) — bombastic tycoon, pitch 0.7, rate 0.85
//   飞天妹 (市场总监) — hype energy, pitch 1.4, rate 1.25
//   云淡风 (首席顾问) — zen calm, pitch 1.0, rate 0.8

import type { TurnReport } from '@/types';

const PREF_KEY = 'skyempire.voice';

type Advisor = {
  name: string;
  pitch: number;
  rate: number;
};

const ADVISORS: readonly Advisor[] = [
  { name: '金满堂', pitch: 0.7, rate: 0.85 },   // 董事长 — bombastic tycoon
  { name: '飞天妹', pitch: 1.4, rate: 1.25 },  // 市场总监 — hype energy
  { name: '云淡风', pitch: 1.0, rate: 0.8 },   // 首席顾问 — zen calm
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

const getVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined') return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'zh-CN') ??
    voices.find((v) => v.lang.startsWith('zh')) ??
    (voices.length > 0 ? voices[0] : null)
  );
};

const speak = (text: string, advisor: Advisor): void => {
  if (typeof window === 'undefined') return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.pitch = advisor.pitch;
  utter.rate = advisor.rate;
  const voice = getVoice();
  if (voice) utter.voice = voice;
  window.speechSynthesis.speak(utter);
};

const buildTurnLine = (report: TurnReport, advisor: Advisor): string => {
  const { profit } = report.totals;
  const M = (Math.abs(profit) / 1_000_000).toFixed(1);
  const totalPax = report.routeStats.reduce((sum, r) => sum + r.pax, 0);
  const paxK = (totalPax / 1000).toFixed(0);

  if (profit > 0) {
    return `${advisor.name}说：本季盈利${M}亿，客流${paxK}K，喜上加喜！`;
  }
  if (profit < 0) {
    return `${advisor.name}说：亏损警报！本季亏损${M}亿，客流${paxK}K！`;
  }
  return `${advisor.name}说：本季收支平衡，客流${paxK}K。`;
};

export const voice = {
  speakTurnReport(report: TurnReport, turn: number): void {
    if (typeof window === 'undefined') return;
    if (!readPref()) return;
    const idx = turn % 3;
    currentAdvisorIndex = idx;
    const advisor = ADVISORS[idx];
    const line = buildTurnLine(report, advisor);
    speak(line, advisor);
  },

  speakMajorEvent(headline: string): void {
    if (typeof window === 'undefined') return;
    if (!readPref()) return;
    const advisor = ADVISORS[currentAdvisorIndex];
    // Truncate headline to keep line ≤ 40 chars
    const short = headline.length > 20 ? headline.slice(0, 20) + '…' : headline;
    const line = `${advisor.name}说：留意事件：${short}`;
    speak(line, advisor);
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
