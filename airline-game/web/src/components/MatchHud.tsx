'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/i18n';
import type { MatchPlayerLite } from '@/types';

type MatchHudProps = {
  code: string;
  turn: number;
  players: MatchPlayerLite[];
  myPlayerId: string;
  turnDeadlineMs: number | null;
  isReady: boolean;
  onReady: () => void;
  busy: boolean;
};

/** V3.3: HUD strip displayed above the GameScreen during an active match. */
export const MatchHud = ({
  code,
  turn,
  players,
  myPlayerId,
  turnDeadlineMs,
  isReady,
  onReady,
  busy,
}: MatchHudProps) => {
  const { t } = useT();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Countdown tick — updates every second.
  useEffect(() => {
    if (turnDeadlineMs === null) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.round((turnDeadlineMs - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [turnDeadlineMs]);

  const readyCount = players.filter((p) => p.ready).length;
  const totalCount = players.length;

  return (
    <div
      data-testid="match-hud"
      className="flex flex-wrap items-center gap-3 border-b border-cyan-900/60 bg-cyan-950/30 px-3 py-1.5 text-xs"
    >
      {/* Room code */}
      <span className="font-mono font-bold tracking-widest text-cyan-300" data-testid="match-hud-code">
        {t('match.hud.code', { code })}
      </span>

      {/* Turn counter */}
      <span className="text-slate-400" data-testid="match-hud-turn">
        {t('match.hud.turn', { turn })}
      </span>

      {/* Players ready indicator */}
      <span
        data-testid="match-hud-ready-indicator"
        className={`rounded-full px-2 py-0.5 font-semibold ${
          readyCount === totalCount
            ? 'bg-emerald-900/60 text-emerald-300'
            : 'bg-ops-800 text-slate-400'
        }`}
      >
        {t('match.hud.ready', { ready: readyCount, total: totalCount })}
      </span>

      {/* Player initials strip */}
      <div className="flex gap-1" data-testid="match-hud-avatars">
        {players.map((p) => {
          const isMe = p.playerId === myPlayerId;
          const initial = (p.name[0] ?? '?').toUpperCase();
          return (
            <span
              key={p.playerId}
              title={`${p.name}${isMe ? ' (you)' : ''} — ${p.ready ? 'ready' : 'waiting'}`}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-1 transition ${
                p.ready
                  ? 'bg-emerald-800 text-emerald-200 ring-emerald-600'
                  : 'bg-ops-800 text-slate-400 ring-ops-600'
              } ${isMe ? 'ring-2 ring-cyan-500' : ''}`}
            >
              {initial}
            </span>
          );
        })}
      </div>

      {/* Deadline countdown */}
      {secondsLeft !== null && (
        <span
          data-testid="match-hud-deadline"
          className={`tabular-nums ${secondsLeft === 0 ? 'text-red-400' : secondsLeft < 30 ? 'text-amber-400' : 'text-slate-400'}`}
        >
          {secondsLeft === 0
            ? t('match.hud.deadline.passed')
            : t('match.hud.deadline', { s: secondsLeft })}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Ready button */}
      <button
        type="button"
        data-testid="match-hud-ready-btn"
        disabled={isReady || busy}
        onClick={onReady}
        className={`rounded px-3 py-1 text-xs font-semibold transition ${
          isReady
            ? 'cursor-default bg-emerald-900/60 text-emerald-300'
            : 'btn-primary'
        }`}
      >
        {isReady ? t('match.hud.ready.done') : t('match.hud.ready.btn')}
      </button>
    </div>
  );
};
