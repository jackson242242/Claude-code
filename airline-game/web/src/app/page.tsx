'use client';

import { useCallback, useEffect, useState } from 'react';
import { FinalScreen } from '@/components/FinalScreen';
import { GameOverScreen } from '@/components/GameOverScreen';
import { GameScreen } from '@/components/GameScreen';
import { LeaderboardScreen } from '@/components/LeaderboardScreen';
import { LobbyScreen } from '@/components/LobbyScreen';
import { MatchActive } from '@/components/MatchActive';
import { ModeSelect, MultiplayerSetup } from '@/components/MultiplayerSetup';
import { StartScreen } from '@/components/StartScreen';
import { TurnReportModal } from '@/components/TurnReportModal';
import { WeeklyScreen } from '@/components/WeeklyScreen';
import { WEEKLY_GAME_ID_KEY, WEEKLY_TOKEN_KEY } from '@/components/WeeklyScreen';
import {
  createGame,
  createMatch,
  endTurn,
  getGame,
  getLeaderboard,
  getMatch,
  getWeekly,
  joinMatch,
  sendCommands,
  startMatch,
  startWeeklyGame,
} from '@/services/api';
import { getLocale, tStandalone } from '@/i18n/standalone';
import { clearKeys, isSessionGoneError } from '@/lib/session';
import { voice } from '@/lib/voice';
import type { Command, FinalResult, GameState, MatchView, TurnReport, WeeklyChallenge } from '@/types';
import type { CreateRoomParams, JoinRoomParams } from '@/components/MultiplayerSetup';

// ── localStorage keys ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'skyempire.gameId';
const MATCH_CODE_KEY = 'skyempire.matchCode';
const MATCH_PLAYER_KEY = 'skyempire.matchPlayerId';

// S1: every key that pins us to a server-side session — cleared on a 404 so a
// wiped game/room (server restart, sleep, redeploy) bounces cleanly to the menu
// instead of dead-ending on "Game not found".
const SESSION_KEYS = [
  STORAGE_KEY,
  MATCH_CODE_KEY,
  MATCH_PLAYER_KEY,
  WEEKLY_GAME_ID_KEY,
  WEEKLY_TOKEN_KEY,
];

const clearSessionKeys = (): void => clearKeys(SESSION_KEYS);

// ── Phase type ────────────────────────────────────────────────────────────────
type Phase =
  | 'booting'
  | 'mode-select'
  | 'start'
  | 'mp-setup'
  | 'lobby'
  | 'game'
  | 'match-active'
  | 'match-finished'
  | 'weekly-entry'
  | 'weekly-game'
  | 'leaderboard';

// ── Main Page ─────────────────────────────────────────────────────────────────

const Page = () => {
  const [phase, setPhase] = useState<Phase>('booting');

  // Single-player state
  const [state, setState] = useState<GameState | null>(null);
  const [report, setReport] = useState<TurnReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Multiplayer state
  const [matchView, setMatchView] = useState<MatchView | null>(null);
  const [matchCode, setMatchCode] = useState<string | null>(null);
  const [matchPlayerId, setMatchPlayerId] = useState<string | null>(null);
  const [matchStandings, setMatchStandings] = useState<FinalResult['standings'] | null>(null);

  // Weekly challenge state
  const [weeklyChallenge, setWeeklyChallenge] = useState<WeeklyChallenge | null>(null);
  const [weeklyLoadError, setWeeklyLoadError] = useState<string | null>(null);

  // Leaderboard context: which weekId and token to show
  const [leaderboardWeekId, setLeaderboardWeekId] = useState<string | undefined>(undefined);

  // Resume an existing game or match from localStorage on load.
  useEffect(() => {
    const savedCode = window.localStorage.getItem(MATCH_CODE_KEY);
    const savedPlayerId = window.localStorage.getItem(MATCH_PLAYER_KEY);
    if (savedCode && savedPlayerId) {
      setMatchCode(savedCode);
      setMatchPlayerId(savedPlayerId);
      setPhase('match-active');
      return;
    }
    // Check for a resumed weekly game
    const weeklyGameId = window.localStorage.getItem(WEEKLY_GAME_ID_KEY);
    if (weeklyGameId) {
      getGame(weeklyGameId)
        .then((resumed) => {
          setState(resumed);
          setPhase('weekly-game');
        })
        .catch(() => {
          window.localStorage.removeItem(WEEKLY_GAME_ID_KEY);
          window.localStorage.removeItem(WEEKLY_TOKEN_KEY);
          setPhase('mode-select');
        });
      return;
    }
    const gameId = window.localStorage.getItem(STORAGE_KEY);
    if (!gameId) {
      setPhase('mode-select');
      return;
    }
    getGame(gameId)
      .then((resumed) => {
        setState(resumed);
        setPhase('game');
      })
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
        setPhase('mode-select');
      });
  }, []);

  const run = useCallback(async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      // S1: a 404 means the server no longer has this game/room (restart, sleep,
      // redeploy). Recover gracefully instead of dead-ending on "Game not found":
      // drop the stale session, reset, and bounce to the menu with a friendly note.
      if (isSessionGoneError(err)) {
        clearSessionKeys();
        setState(null);
        setMatchView(null);
        setMatchCode(null);
        setMatchPlayerId(null);
        setMatchStandings(null);
        setReport(null);
        setPhase('mode-select');
        setError(tStandalone(getLocale(), 'session.expired'));
      } else {
        setError(err instanceof Error ? err.message : '请求失败，请稍后重试');
      }
    } finally {
      setBusy(false);
    }
  }, []);

  // ── Single-player handlers ────────────────────────────────────────────────

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
    window.localStorage.removeItem(MATCH_CODE_KEY);
    window.localStorage.removeItem(MATCH_PLAYER_KEY);
    window.localStorage.removeItem(WEEKLY_GAME_ID_KEY);
    window.localStorage.removeItem(WEEKLY_TOKEN_KEY);
    setState(null);
    setReport(null);
    setError(null);
    setMatchView(null);
    setMatchCode(null);
    setMatchPlayerId(null);
    setMatchStandings(null);
    setWeeklyChallenge(null);
    setWeeklyLoadError(null);
    setLeaderboardWeekId(undefined);
    setPhase('mode-select');
  }, []);

  // ── Multiplayer handlers ──────────────────────────────────────────────────

  const handleCreateRoom = useCallback(
    (params: CreateRoomParams) =>
      run(async () => {
        const { code, playerId } = await createMatch(
          params.airlineName,
          params.hqCityId,
          params.maxPlayers,
          params.fillWithAI,
        );
        window.localStorage.setItem(MATCH_CODE_KEY, code);
        window.localStorage.setItem(MATCH_PLAYER_KEY, playerId);
        setMatchCode(code);
        setMatchPlayerId(playerId);
        const view = await getMatch(code, playerId);
        setMatchView(view);
        setPhase('lobby');
      }),
    [run],
  );

  const handleJoinRoom = useCallback(
    (params: JoinRoomParams) =>
      run(async () => {
        const { playerId } = await joinMatch(params.code, params.airlineName, params.hqCityId);
        window.localStorage.setItem(MATCH_CODE_KEY, params.code);
        window.localStorage.setItem(MATCH_PLAYER_KEY, playerId);
        setMatchCode(params.code);
        setMatchPlayerId(playerId);
        const view = await getMatch(params.code, playerId);
        setMatchView(view);
        setPhase('lobby');
      }),
    [run],
  );

  const handleStartMatch = useCallback(() => {
    if (!matchCode || !matchPlayerId) return;
    void run(async () => {
      const view = await startMatch(matchCode, matchPlayerId);
      setMatchView(view);
      setPhase('match-active');
    });
  }, [run, matchCode, matchPlayerId]);

  const handleMatchFinished = useCallback((standings: FinalResult['standings']) => {
    setMatchStandings(standings);
    window.localStorage.removeItem(MATCH_CODE_KEY);
    window.localStorage.removeItem(MATCH_PLAYER_KEY);
    setPhase('match-finished');
  }, []);

  const handleLeaveMatch = useCallback(() => {
    window.localStorage.removeItem(MATCH_CODE_KEY);
    window.localStorage.removeItem(MATCH_PLAYER_KEY);
    setMatchCode(null);
    setMatchPlayerId(null);
    setMatchView(null);
    setMatchStandings(null);
    setPhase('mode-select');
  }, []);

  // ── Weekly challenge handlers ─────────────────────────────────────────────

  const handleEnterWeekly = useCallback(() => {
    setWeeklyChallenge(null);
    setWeeklyLoadError(null);
    setPhase('weekly-entry');
    getWeekly()
      .then((challenge) => setWeeklyChallenge(challenge))
      .catch(() => setWeeklyLoadError('无法加载本周挑战，请稍后重试'));
  }, []);

  const handleStartWeekly = useCallback(
    (airlineName: string) =>
      run(async () => {
        const created = await startWeeklyGame(airlineName);
        // Persist token + gameId for resumption and leaderboard isYou matching
        window.localStorage.setItem(WEEKLY_GAME_ID_KEY, created.id);
        if (created.playerToken) {
          window.localStorage.setItem(WEEKLY_TOKEN_KEY, created.playerToken);
        }
        setState(created);
        setPhase('weekly-game');
      }),
    [run],
  );

  const handleViewLeaderboard = useCallback((weekId?: string) => {
    setLeaderboardWeekId(weekId);
    setPhase('leaderboard');
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'booting') {
    return (
      <main className="flex h-dvh items-center justify-center text-sm tracking-widest text-glow">
        正在连接运营中心…
      </main>
    );
  }

  if (phase === 'mode-select') {
    return (
      <ModeSelect
        onSolo={() => setPhase('start')}
        onMulti={() => setPhase('mp-setup')}
        onWeekly={handleEnterWeekly}
      />
    );
  }

  if (phase === 'start') {
    return <StartScreen busy={busy} error={error} onCreate={handleCreate} />;
  }

  if (phase === 'mp-setup') {
    return (
      <MultiplayerSetup
        busy={busy}
        error={error}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onBack={() => setPhase('mode-select')}
      />
    );
  }

  if (phase === 'lobby' && matchView && matchCode && matchPlayerId) {
    return (
      <LobbyScreen
        view={matchView}
        myPlayerId={matchPlayerId}
        onStart={handleStartMatch}
        onLeave={handleLeaveMatch}
        busy={busy}
        error={error}
      />
    );
  }

  if (phase === 'match-active' && matchCode && matchPlayerId) {
    return (
      <MatchActive
        code={matchCode}
        playerId={matchPlayerId}
        onFinished={handleMatchFinished}
        onLeave={handleLeaveMatch}
      />
    );
  }

  if (phase === 'match-finished' && matchStandings) {
    const standings = matchStandings;
    const fakeResult: FinalResult = {
      rank: standings.findIndex((s) => s.isPlayer) + 1 || 1,
      victory: standings[0]?.isPlayer ?? false,
      standings,
      cumulativeProfit: 0,
      cumulativePax: 0,
      endedTurn: 80,
    };
    return (
      <FinalScreen
        airlineName={standings.find((s) => s.isPlayer)?.name ?? ''}
        gameId={matchCode ?? 'match'}
        finalResult={fakeResult}
        onRestart={handleRestart}
      />
    );
  }

  // ── Weekly entry ──────────────────────────────────────────────────────────

  if (phase === 'weekly-entry') {
    if (weeklyLoadError) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
          <p className="text-sm text-red-300">{weeklyLoadError}</p>
          <button
            type="button"
            onClick={() => setPhase('mode-select')}
            className="text-sm text-slate-400 hover:text-white"
          >
            返回
          </button>
        </main>
      );
    }
    if (!weeklyChallenge) {
      return (
        <main className="flex min-h-dvh items-center justify-center text-sm text-slate-400">
          加载本周挑战…
        </main>
      );
    }
    return (
      <WeeklyScreen
        challenge={weeklyChallenge}
        busy={busy}
        error={error}
        onStart={handleStartWeekly}
        onViewLeaderboard={() => handleViewLeaderboard(weeklyChallenge.weekId)}
        onBack={() => setPhase('mode-select')}
      />
    );
  }

  // ── Weekly game (same as single-player game; weeklyWeekId is set on state) ──

  if (phase === 'weekly-game' && state) {
    const weeklyToken = window.localStorage.getItem(WEEKLY_TOKEN_KEY) ?? undefined;
    const weekId = state.weeklyWeekId ?? undefined;
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
          <GameOverScreen
            airlineName={state.airlineName}
            gameId={state.id}
            onRestart={handleRestart}
          />
        )}
        {!report && state.status === 'finished' && state.finalResult && (
          <FinalScreen
            airlineName={state.airlineName}
            gameId={state.id}
            finalResult={state.finalResult}
            onRestart={handleRestart}
            onViewLeaderboard={weekId ? () => {
              window.localStorage.removeItem(WEEKLY_GAME_ID_KEY);
              handleViewLeaderboard(weekId);
              // Pass token to leaderboard via state; weeklyToken already in localStorage
              void getLeaderboard(weekId, weeklyToken);
            } : undefined}
          />
        )}
      </>
    );
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────

  if (phase === 'leaderboard') {
    const weeklyToken = window.localStorage.getItem(WEEKLY_TOKEN_KEY) ?? undefined;
    return (
      <LeaderboardScreen
        weekId={leaderboardWeekId}
        token={weeklyToken}
        onBack={() => {
          // Go back to weekly entry if we have a challenge loaded, else mode-select
          if (weeklyChallenge) {
            setPhase('weekly-entry');
          } else {
            setPhase('mode-select');
          }
        }}
      />
    );
  }

  if (phase === 'game' && state) {
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
          <GameOverScreen
            airlineName={state.airlineName}
            gameId={state.id}
            onRestart={handleRestart}
          />
        )}
        {!report && state.status === 'finished' && state.finalResult && (
          <FinalScreen
            airlineName={state.airlineName}
            gameId={state.id}
            finalResult={state.finalResult}
            onRestart={handleRestart}
          />
        )}
      </>
    );
  }

  // Fallback — show mode select
  return (
    <ModeSelect
      onSolo={() => setPhase('start')}
      onMulti={() => setPhase('mp-setup')}
      onWeekly={handleEnterWeekly}
    />
  );
};

export default Page;
