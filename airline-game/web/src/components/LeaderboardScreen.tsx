'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/lib/format';
import { useT } from '@/i18n';
import { getLeaderboard } from '@/services/api';
import type { LeaderboardEntry } from '@/types';

// ── Props ─────────────────────────────────────────────────────────────────────

type LeaderboardScreenProps = {
  /** Initial weekId to display. If undefined, backend defaults to current week. */
  weekId?: string;
  /** Player token for isYou highlighting. */
  token?: string;
  onBack: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const LeaderboardScreen = ({ weekId: initialWeekId, token, onBack }: LeaderboardScreenProps) => {
  const { t } = useT();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [weekId, setWeekId] = useState<string | undefined>(initialWeekId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const youRowRef = useRef<HTMLTableRowElement | null>(null);

  const fetchLeaderboard = useCallback(async (wid?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard(wid, token);
      setEntries(res.entries);
      setWeekId(res.weekId);
    } catch {
      setError(t('leaderboard.error'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    void fetchLeaderboard(initialWeekId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to the player's own row after rendering.
  useEffect(() => {
    if (youRowRef.current && typeof youRowRef.current.scrollIntoView === 'function') {
      youRowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [entries]);

  return (
    <main
      data-testid="leaderboard-screen"
      className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 py-8"
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">SkyEmpire · V3.4</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{t('leaderboard.heading')}</h1>
          {weekId && (
            <p className="mt-0.5 text-sm text-slate-400">
              <span className="text-slate-500">{t('leaderboard.weekId.label')}:</span>{' '}
              <span
                data-testid="leaderboard-week-id"
                className="font-mono text-amber-400"
              >
                {weekId}
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          data-testid="leaderboard-refresh-btn"
          onClick={() => void fetchLeaderboard(weekId)}
          disabled={loading}
          className="rounded border border-ops-600 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-cyan-700 transition disabled:opacity-40"
        >
          {t('leaderboard.btn.refresh')}
        </button>
      </header>

      {/* Content */}
      {loading ? (
        <p data-testid="leaderboard-loading" className="text-center text-sm text-slate-500 py-8">
          {t('leaderboard.loading')}
        </p>
      ) : error ? (
        <p data-testid="leaderboard-error" role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : entries.length === 0 ? (
        <p
          data-testid="leaderboard-empty"
          className="text-center text-sm text-slate-400 py-12"
        >
          {t('leaderboard.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-ops-700">
          <table
            data-testid="leaderboard-table"
            className="w-full text-sm"
          >
            <thead>
              <tr className="border-b border-ops-700 bg-ops-900 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2 text-center">{t('leaderboard.col.rank')}</th>
                <th className="px-3 py-2 text-left">{t('leaderboard.col.name')}</th>
                <th className="px-3 py-2 text-right">{t('leaderboard.col.score')}</th>
                <th className="px-3 py-2 text-right">{t('leaderboard.col.profit')}</th>
                <th className="px-3 py-2 text-right">{t('leaderboard.col.share')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={`${entry.rank}-${entry.name}`}
                  data-testid={`leaderboard-row-${entry.rank}`}
                  ref={entry.isYou ? youRowRef : undefined}
                  className={`border-b border-ops-800 ${
                    entry.isYou
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-900'
                      : 'text-slate-400 hover:bg-ops-800/30'
                  }`}
                >
                  <td className="px-3 py-2 text-center font-bold tabular-nums">
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {entry.name}
                    {entry.isYou && (
                      <span
                        data-testid="leaderboard-you-badge"
                        className="ml-1.5 rounded-full border border-cyan-700 px-1.5 py-0.5 text-[10px] text-cyan-400"
                      >
                        {t('leaderboard.you')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-amber-400">
                    {entry.score.toLocaleString()}
                  </td>
                  <td
                    data-testid={entry.isYou ? 'leaderboard-you-profit' : undefined}
                    className={`px-3 py-2 text-right tabular-nums ${entry.profit < 0 ? 'text-red-400' : ''}`}
                  >
                    {formatMoney(entry.profit)}
                  </td>
                  <td
                    data-testid={entry.isYou ? 'leaderboard-you-share' : undefined}
                    className="px-3 py-2 text-right tabular-nums"
                  >
                    {(entry.marketShare * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Back button */}
      <button
        type="button"
        data-testid="leaderboard-back-btn"
        onClick={onBack}
        className="mt-auto text-sm text-slate-500 hover:text-slate-300 text-center"
      >
        {t('leaderboard.btn.back')}
      </button>
    </main>
  );
};
