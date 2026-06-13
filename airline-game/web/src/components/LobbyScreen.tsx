'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/i18n';
import type { MatchView } from '@/types';

type LobbyScreenProps = {
  view: MatchView;
  myPlayerId: string;
  /** Index of the player in `view.players` who is the host (player[0]). */
  onStart: () => void;
  onLeave: () => void;
  busy: boolean;
  error: string | null;
};

/** V3.3: Lobby waiting room shown while phase === "lobby". */
export const LobbyScreen = ({
  view,
  myPlayerId,
  onStart,
  onLeave,
  busy,
  error,
}: LobbyScreenProps) => {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  // Reset copy toast when code changes.
  useEffect(() => {
    setCopied(false);
  }, [view.code]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(view.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Host is always players[0].
  const isHost = view.players.length > 0 && view.players[0].playerId === myPlayerId;
  const canStart = view.players.length >= 2 && isHost;

  return (
    <main
      data-testid="lobby-screen"
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8"
    >
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-glow">SkyEmpire · V3.3</p>
        <h1 className="mt-2 text-2xl font-bold text-white">{t('lobby.heading')}</h1>
      </header>

      {/* Room code — big + copyable */}
      <section className="panel flex flex-col items-center gap-3 p-6" data-testid="lobby-code-section">
        <p className="text-xs uppercase tracking-widest text-slate-500">{t('lobby.code.label')}</p>
        <span
          data-testid="lobby-room-code"
          className="font-mono text-4xl font-bold tracking-[0.25em] text-cyan-300"
        >
          {view.code}
        </span>
        <button
          type="button"
          data-testid="lobby-copy-btn"
          onClick={handleCopy}
          className="rounded bg-ops-700 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-ops-600"
        >
          {copied ? t('lobby.code.copied') : t('lobby.code.copy')}
        </button>
      </section>

      {/* Player list */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">{t('lobby.players.heading')}</h2>
        <ul className="flex flex-col gap-2" data-testid="lobby-player-list">
          {view.players.map((player, idx) => {
            const isMe = player.playerId === myPlayerId;
            const isHostPlayer = idx === 0;
            return (
              <li
                key={player.playerId}
                data-testid={`lobby-player-${player.playerId}`}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  isMe
                    ? 'border-cyan-700 bg-cyan-950/40 text-cyan-200'
                    : 'border-ops-700 bg-ops-800/40 text-slate-300'
                }`}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-ops-700 text-[11px] font-bold text-white"
                >
                  {(player.name[0] ?? '?').toUpperCase()}
                </span>
                <span className="flex-1 font-medium">
                  {player.name}
                  {isMe && (
                    <span className="ml-1 text-xs text-slate-400">{t('lobby.player.you')}</span>
                  )}
                </span>
                {isHostPlayer && (
                  <span className="rounded bg-amber-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    {t('lobby.player.host')}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {view.players.length < 2 && (
          <p className="mt-2 text-xs text-slate-500">{t('lobby.waiting')}</p>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {isHost && (
          <button
            type="button"
            data-testid="lobby-start-btn"
            disabled={!canStart || busy}
            onClick={onStart}
            title={!canStart ? t('lobby.btn.start.disabled') : undefined}
            className="btn-primary w-full px-4 py-3 text-base disabled:opacity-40"
          >
            {busy ? t('lobby.btn.starting') : t('lobby.btn.start')}
          </button>
        )}
        <button
          type="button"
          data-testid="lobby-leave-btn"
          onClick={onLeave}
          className="w-full rounded-lg border border-ops-600 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
        >
          {t('lobby.btn.leave')}
        </button>
      </div>
    </main>
  );
};
