'use client';

import { useCallback, useEffect, useState } from 'react';
import { FinalScreen } from '@/components/FinalScreen';
import { GameOverScreen } from '@/components/GameOverScreen';
import { GameScreen } from '@/components/GameScreen';
import { StartScreen } from '@/components/StartScreen';
import { TurnReportModal } from '@/components/TurnReportModal';
import { createGame, endTurn, getGame, sendCommands } from '@/services/api';
import { voice } from '@/lib/voice';
import type { Command, GameState, TurnReport } from '@/types';

const STORAGE_KEY = 'skyempire.gameId';

type Phase = 'booting' | 'start' | 'game';

const Page = () => {
  const [phase, setPhase] = useState<Phase>('booting');
  const [state, setState] = useState<GameState | null>(null);
  const [report, setReport] = useState<TurnReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Resume an existing game from localStorage on load.
  useEffect(() => {
    const gameId = window.localStorage.getItem(STORAGE_KEY);
    if (!gameId) {
      setPhase('start');
      return;
    }
    getGame(gameId)
      .then((resumed) => {
        setState(resumed);
        setPhase('game');
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
        setPhase('start');
      });
  }, []);

  const run = useCallback(async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请稍后重试');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleCreate = useCallback(
    (airlineName: string, hqCityId: string) =>
      run(async () => {
        const created = await createGame(airlineName, hqCityId);
        window.localStorage.setItem(STORAGE_KEY, created.id);
        setState(created);
        setPhase('game');
      }),
    [run],
  );

  const handleCommands = useCallback(
    (commands: Command[]) => {
      if (!state) return Promise.resolve();
      return run(async () => {
        const { state: next, results } = await sendCommands(state.id, commands);
        setState(next);
        const failures = results.filter((result) => !result.ok);
        if (failures.length > 0) {
          setError(failures.map((failure) => failure.message ?? '指令执行失败').join('；'));
        }
      });
    },
    [run, state],
  );

  const handleEndTurn = useCallback(() => {
    if (!state) return Promise.resolve();
    return run(async () => {
      const { state: next, report: turnReport } = await endTurn(state.id);
      setState(next);
      setReport(turnReport);
      voice.speakTurnReport(turnReport, next.turn);
    });
  }, [run, state]);

  const handleRestart = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(null);
    setReport(null);
    setError(null);
    setPhase('start');
  }, []);

  if (phase === 'booting') {
    return (
      <main className="flex h-dvh items-center justify-center text-sm tracking-widest text-glow">
        正在连接运营中心…
      </main>
    );
  }

  if (phase === 'start' || !state) {
    return <StartScreen busy={busy} error={error} onCreate={handleCreate} />;
  }

  return (
    <>
      <GameScreen
        state={state}
        busy={busy}
        error={error}
        onDismissError={() => setError(null)}
        onCommands={handleCommands}
        onEndTurn={handleEndTurn}
      />
      {report && (
        <TurnReportModal report={report} state={state} onClose={() => setReport(null)} />
      )}
      {!report && state.status === 'bankrupt' && (
        <GameOverScreen airlineName={state.airlineName} onRestart={handleRestart} />
      )}
      {!report && state.status === 'finished' && state.finalResult && (
        <FinalScreen
          airlineName={state.airlineName}
          finalResult={state.finalResult}
          onRestart={handleRestart}
        />
      )}
    </>
  );
};

export default Page;
