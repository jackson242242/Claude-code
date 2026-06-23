'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GameScreen } from '@/components/GameScreen';
import { LobbyScreen } from '@/components/LobbyScreen';
import { MatchHud } from '@/components/MatchHud';
import { TurnReportModal } from '@/components/TurnReportModal';
import { FinalScreen } from '@/components/FinalScreen';
import { readyMatch, sendMatchCommands } from '@/services/api';
import { useMatchPoll } from '@/hooks/useMatchPoll';
import { getLocale, tStandalone } from '@/i18n/standalone';
import { clearKeys } from '@/lib/session';
import { voice } from '@/lib/voice';
import type { Command, FinalResult, TurnReport } from '@/types';

// Match-specific localStorage keys (mirrors page.tsx constants — stable strings)
const MATCH_SESSION_KEYS = ['skyempire.matchCode', 'skyempire.matchPlayerId'] as const;

type MatchActiveProps = {
  code: string;
  playerId: string;
  /** Called when the poll reveals phase==="finished" with full standings. */
  onFinished: (standings: FinalResult['standings']) => void;
  onLeave: () => void;
};

/**
 * V3.3: Wrapper component that owns the match poll + game loop.
 * Renders:
 *   - MatchHud (strip with room code, ready indicator, countdown)
 *   - GameScreen (reused directly with view.you as the GameState)
 *   - TurnReportModal (shown on each settled turn)
 * GameScreen's "下一季度" button is replaced by "准备结算" via matchMode prop.
 * S5: Shows a localized "room expired" screen on 404 (server restart) and
 *     proactively clears match session keys so a page refresh doesn't loop
 *     back into the same dead room.
 */
export const MatchActive = ({
  code,
  playerId,
  onFinished,
  onLeave,
}: MatchActiveProps) => {
  const { view, error: pollError, roomGone } = useMatchPoll(code, playerId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TurnReport | null>(null);
  const prevTurnRef = useRef<number | null>(null);

  // S5: When the room is gone (404 → server restart), clear match session keys
  // immediately so a page refresh doesn't cycle back into the same dead room.
  useEffect(() => {
    if (roomGone) {
      clearKeys(MATCH_SESSION_KEYS);
    }
  }, [roomGone]);

  const run = useCallback(async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setBusy(false);
    }
  }, []);

  // Detect turn settlement → show TurnReportModal.
  // Also detect finished phase → hand off to parent.
  useEffect(() => {
    if (!view) return;
    if (view.phase === 'finished') {
      if (view.finalStandings) {
        onFinished(view.finalStandings);
      }
      return;
    }
    if (prevTurnRef.current !== null && view.turn > prevTurnRef.current && view.lastReport) {
      setReport(view.lastReport);
      voice.speakTurnReport(view.lastReport, view.turn);
    }
    prevTurnRef.current = view.turn;
  }, [view, onFinished]);

  const handleCommands = useCallback(
    (commands: Command[]) =>
      run(async () => {
        const { results } = await sendMatchCommands(code, playerId, commands);
        const failures = results.filter((r) => !r.ok);
        if (failures.length > 0) {
          setError(failures.map((f) => f.message ?? '指令执行失败').join('；'));
        }
      }),
    [run, code, playerId],
  );

  const handleReady = useCallback(
    () =>
      run(async () => {
        await readyMatch(code, playerId);
      }),
    [run, code, playerId],
  );

  // S5: Room not found (404 / server restart) — show localized expired screen.
  if (roomGone) {
    const locale = getLocale();
    return (
      <main
        data-testid="match-room-expired"
        className="flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <p className="max-w-sm text-sm text-amber-300">
          {tStandalone(locale, 'match.room.expired')}
        </p>
        <button
          type="button"
          onClick={onLeave}
          className="rounded bg-cyan-800 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
        >
          {tStandalone(locale, 'match.back')}
        </button>
      </main>
    );
  }

  if (!view) {
    return (
      <main className="flex h-dvh items-center justify-center text-sm tracking-widest text-glow">
        {pollError ?? '连接多人房间中…'}
      </main>
    );
  }

  // If we have a finished view with standings, show it inline (parent should also
  // transition, but guard here so we don't render an invalid GameScreen).
  if (view.phase === 'finished' && view.finalStandings) {
    const standings = view.finalStandings;
    const fakeResult: FinalResult = {
      rank: standings.findIndex((s) => s.isPlayer) + 1 || 1,
      victory: standings[0]?.isPlayer ?? false,
      standings,
      cumulativeProfit: view.you.lifetime.profit,
      cumulativePax: view.you.lifetime.pax,
      endedTurn: view.turn,
    };
    return (
      <FinalScreen
        airlineName={view.you.airlineName}
        gameId={code}
        finalResult={fakeResult}
        onRestart={onLeave}
      />
    );
  }

  // Lobby phase (e.g. resumed session before start)
  if (view.phase === 'lobby') {
    return (
      <LobbyScreen
        view={view}
        myPlayerId={playerId}
        onStart={() => { /* host starts via page.tsx */ }}
        onLeave={onLeave}
        busy={false}
        error={null}
      />
    );
  }

  const me = view.players.find((p) => p.playerId === playerId);
  const isReady = me?.ready ?? false;

  return (
    <>
      <div className="flex h-dvh flex-col">
        {/* MatchHud strip above GameScreen */}
        <MatchHud
          code={view.code}
          turn={view.turn}
          players={view.players}
          myPlayerId={playerId}
          turnDeadlineMs={view.turnDeadlineMs}
          isReady={isReady}
          onReady={handleReady}
          busy={busy}
        />

        <div className="flex min-h-0 flex-1 flex-col">
          {/* KEY REUSE: GameScreen renders view.you (a normal GameState).
              view.you.competitors already includes AI + other human players,
              so WorldMap/FinanceTab/competitor arcs all work without changes.
              We only change the end-turn action via matchMode prop. */}
          <GameScreen
            state={view.you}
            busy={busy}
            error={error ?? pollError}
            onDismissError={() => setError(null)}
            onCommands={handleCommands}
            onEndTurn={handleReady}
            matchMode={{ isReady, onReady: handleReady }}
          />
        </div>
      </div>

      {report && (
        <TurnReportModal
          report={report}
          state={view.you}
          onClose={() => setReport(null)}
        />
      )}
    </>
  );
};
