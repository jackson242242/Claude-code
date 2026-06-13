'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/format';
import { audio } from '@/lib/audio';
import { voice } from '@/lib/voice';
import { useT, type Locale } from '@/i18n';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { MapSettingsPopover } from '@/components/MapSettingsPopover';
import type { ProjectionId } from '@/lib/map';
import type { MapThemeId } from '@/lib/mapTheme';
import type { GameState } from '@/types';

// Brand gauge color bands: <35 red / 35–65 neutral / >65 cyan
const brandColor = (brand: number): string => {
  if (brand < 35) return 'text-red-400 border-red-700 bg-red-950/50';
  if (brand > 65) return 'text-accent border-accent/50 bg-accent/10';
  return 'text-slate-300 border-slate-600 bg-ops-800/50';
};

type BrandPillProps = { brand: number };

const BrandPill = ({ brand }: BrandPillProps) => {
  const { t } = useT();
  const animated = useAnimatedNumber(brand);
  return (
    <div
      data-testid="brand-pill"
      className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors ${brandColor(animated)}`}
      title={`${t('brand.pill.label')} ${animated}`}
    >
      <span>⭑</span>
      <span>{Math.round(animated)}</span>
    </div>
  );
};

type TopBarProps = {
  state: GameState;
  busy: boolean;
  onEndTurn: () => void;
  projectionId?: ProjectionId;
  themeId?: MapThemeId;
  onProjectionChange?: (p: ProjectionId) => void;
  onThemeChange?: (t: MapThemeId) => void;
};

const LOCALE_LABELS: Record<Locale, string> = { zh: '中', en: 'EN', es: 'ES' };
const LOCALES: Locale[] = ['zh', 'en', 'es'];

export const TopBar = ({
  state,
  busy,
  onEndTurn,
  projectionId = 'naturalEarth',
  themeId = 'dark-ops',
  onProjectionChange = () => undefined,
  onThemeChange = () => undefined,
}: TopBarProps) => {
  const { t, locale, setLocale } = useT();
  const [audioPlaying, setAudioPlaying] = useState(() => audio.isPlaying());
  const [voiceOn, setVoiceOn] = useState(() => voice.isEnabled());
  const animatedCash = useAnimatedNumber(state.cash);

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
          {formatMoney(animatedCash)}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{t('topbar.cash')}</p>
      </div>

      {/* V3.7: Brand gauge pill */}
      <BrandPill brand={state.brand} />

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

      {/* V3.2: Map settings popover */}
      <MapSettingsPopover
        projectionId={projectionId}
        themeId={themeId}
        onProjectionChange={onProjectionChange}
        onThemeChange={onThemeChange}
      />

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
