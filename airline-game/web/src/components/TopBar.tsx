'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/format';
import { audio } from '@/lib/audio';
import { voice } from '@/lib/voice';
import { useT, type Locale } from '@/i18n';
import type { GameState } from '@/types';

type TopBarProps = {
  state: GameState;
  busy: boolean;
  onEndTurn: () => void;
};

const LOCALE_LABELS: Record<Locale, string> = { zh: '中', en: 'EN', es: 'ES' };
const LOCALES: Locale[] = ['zh', 'en', 'es'];

export const TopBar = ({ state, busy, onEndTurn }: TopBarProps) => {
  const { t, locale, setLocale } = useT();
  const [audioPlaying, setAudioPlaying] = useState(() => audio.isPlaying());
  const [voiceOn, setVoiceOn] = useState(() => voice.isEnabled());

  const handleEndTurn = () => {
    // Respect browser autoplay policy: start audio on first user gesture.
    audio.start();
    onEndTurn();
  };

  const handleAudioToggle = () => {
    // audio.start() must be called before toggle (first gesture).
    audio.start();
    audio.toggle();
    setAudioPlaying(audio.isPlaying());
  };

  const handleVoiceToggle = () => {
    voice.toggle();
    setVoiceOn(voice.isEnabled());
  };

  return (
    <header className="flex items-center gap-3 border-b border-ops-700 bg-ops-900/95 px-3 py-2.5 backdrop-blur">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-bold text-white">{state.airlineName}</h1>
        <p className="text-[11px] tracking-wider text-slate-500" title={t('topbar.turn', { turn: state.turn })}>
          {state.year} Q{state.quarter} · {t('topbar.turn', { turn: state.turn })}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-base font-bold tabular-nums ${
            state.cash < 0 ? 'text-red-400' : 'text-accent'
          }`}
          data-testid="cash"
        >
          {formatMoney(state.cash)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{t('topbar.cash')}</p>
      </div>

      {/* Language switcher */}
      <div
        data-testid="locale-switcher"
        className="flex overflow-hidden rounded-md border border-ops-600 text-[11px] font-semibold"
      >
        {LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            aria-pressed={locale === loc}
            onClick={() => setLocale(loc)}
            className={`px-2 py-1 transition ${
              locale === loc
                ? 'bg-accent/20 text-accent'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {LOCALE_LABELS[loc]}
          </button>
        ))}
      </div>

      {/* Audio toggle */}
      <button
        type="button"
        aria-label={audioPlaying ? t('topbar.aria.audioOn') : t('topbar.aria.audioOff')}
        onClick={handleAudioToggle}
        className="text-lg text-slate-400 hover:text-white"
      >
        {audioPlaying ? '🔊' : '🔇'}
      </button>

      {/* Voice toggle */}
      <button
        type="button"
        aria-label={voiceOn ? t('topbar.aria.voiceOn') : t('topbar.aria.voiceOff')}
        onClick={handleVoiceToggle}
        className="text-lg text-slate-400 hover:text-white"
      >
        {voiceOn ? '🗣' : '🔕'}
      </button>

      <button
        type="button"
        onClick={handleEndTurn}
        disabled={busy || state.status !== 'active'}
        className="btn-primary px-3.5 py-2 text-sm"
      >
        {busy ? t('topbar.btn.settling') : t('topbar.btn.nextTurn')}
      </button>
    </header>
  );
};
