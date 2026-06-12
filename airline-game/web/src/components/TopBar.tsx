'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/format';
import { audio } from '@/lib/audio';
import { voice } from '@/lib/voice';
import type { GameState } from '@/types';

type TopBarProps = {
  state: GameState;
  busy: boolean;
  onEndTurn: () => void;
};

export const TopBar = ({ state, busy, onEndTurn }: TopBarProps) => {
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
        <p className="text-[11px] tracking-wider text-slate-500" title={`第 ${state.turn}/80 季`}>
          {state.year} Q{state.quarter} · 第 {state.turn}/80 季
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
        <p className="text-[10px] uppercase tracking-widest text-slate-500">现金</p>
      </div>

      {/* Audio toggle */}
      <button
        type="button"
        aria-label={audioPlaying ? '关闭音乐' : '开启音乐'}
        onClick={handleAudioToggle}
        className="text-lg text-slate-400 hover:text-white"
      >
        {audioPlaying ? '🔊' : '🔇'}
      </button>

      {/* Voice toggle */}
      <button
        type="button"
        aria-label={voiceOn ? '关闭语音' : '开启语音'}
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
        {busy ? '结算中…' : '下一季度 ▸'}
      </button>
    </header>
  );
};
