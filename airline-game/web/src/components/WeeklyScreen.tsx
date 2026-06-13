'use client';

import { useEffect, useState } from 'react';
import { CityCard } from '@/components/CityCard';
import { CITY_BY_ID } from '@/lib/data';
import { useT } from '@/i18n';
import type { WeeklyChallenge } from '@/types';

// ── localStorage key for weekly token ────────────────────────────────────────
export const WEEKLY_TOKEN_KEY = 'skyempire.weekly.token';
export const WEEKLY_GAME_ID_KEY = 'skyempire.weekly.gameId';

// ── Countdown helper ──────────────────────────────────────────────────────────

const useCountdown = (endsAtMs: number) => {
  const [remaining, setRemaining] = useState<number>(() => Math.max(0, endsAtMs - Date.now()));

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, endsAtMs - Date.now()));
    tick();
    const id = setInterval(tick, 60_000); // update every minute
    return () => clearInterval(id);
  }, [endsAtMs]);

  return remaining;
};

const formatCountdown = (
  remainingMs: number,
  t: (key: import('@/i18n').DictKeys, params?: Record<string, string | number>) => string,
): string => {
  if (remainingMs <= 0) return t('weekly.countdown.ended');
  const totalSeconds = Math.floor(remainingMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  if (days > 0) return t('weekly.countdown.days', { d: days, h: hours });
  return t('weekly.countdown.hours', { h: hours, m: minutes });
};

// ── Props ─────────────────────────────────────────────────────────────────────

type WeeklyScreenProps = {
  challenge: WeeklyChallenge;
  busy: boolean;
  error: string | null;
  onStart: (airlineName: string) => void;
  onViewLeaderboard: () => void;
  onBack: () => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const WeeklyScreen = ({
  challenge,
  busy,
  error,
  onStart,
  onViewLeaderboard,
  onBack,
}: WeeklyScreenProps) => {
  const { t } = useT();
  const [airlineName, setAirlineName] = useState('');
  const remaining = useCountdown(challenge.endsAtMs);
  const hqCity = CITY_BY_ID.get(challenge.hqCityId) ?? null;

  const canStart = airlineName.trim().length > 0 && !busy && remaining > 0;

  return (
    <main
      data-testid="weekly-screen"
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8"
    >
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-400">SkyEmpire · V3.4</p>
        <h1 className="mt-2 text-2xl font-bold text-white">{t('weekly.heading')}</h1>
      </header>

      {/* Week ID + countdown */}
      <section className="panel p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{t('weekly.weekId.label')}</span>
          <span
            data-testid="weekly-week-id"
            className="font-mono font-bold text-amber-400"
          >
            {challenge.weekId}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{t('weekly.countdown.label')}</span>
          <span
            data-testid="weekly-countdown"
            className={`font-bold tabular-nums ${remaining <= 0 ? 'text-red-400' : 'text-glow'}`}
          >
            {formatCountdown(remaining, t)}
          </span>
        </div>
      </section>

      {/* Explainer */}
      <p
        data-testid="weekly-explainer"
        className="text-center text-sm text-slate-400 italic"
      >
        {t('weekly.explainer')}
      </p>

      {/* HQ city */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">{t('weekly.hq.label')}</h2>
        {hqCity ? (
          <div data-testid="weekly-hq-city">
            <CityCard city={hqCity} selected={false} onClick={() => undefined} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">{challenge.hqCityId}</p>
        )}
      </section>

      {/* Airline name input */}
      <section className="panel p-4">
        <label htmlFor="weekly-airline-name" className="text-sm font-semibold text-slate-300">
          {t('weekly.airline.label')}
        </label>
        <input
          id="weekly-airline-name"
          data-testid="weekly-airline-name"
          value={airlineName}
          onChange={(e) => setAirlineName(e.target.value)}
          maxLength={30}
          placeholder={t('weekly.airline.placeholder')}
          className="mt-2 w-full rounded-lg border border-ops-600 bg-ops-900 px-3 py-2.5 text-base text-white outline-none placeholder:text-slate-600 focus:border-glow"
        />
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          data-testid="weekly-start-btn"
          disabled={!canStart}
          onClick={() => {
            if (airlineName.trim()) onStart(airlineName.trim());
          }}
          className="btn-primary w-full px-4 py-3 text-sm disabled:opacity-50"
        >
          {busy ? t('weekly.btn.starting') : t('weekly.btn.start')}
        </button>

        <button
          type="button"
          data-testid="weekly-leaderboard-btn"
          onClick={onViewLeaderboard}
          className="w-full rounded-lg border border-ops-600 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:border-cyan-700 transition"
        >
          {t('weekly.btn.leaderboard')}
        </button>

        <button
          type="button"
          data-testid="weekly-back-btn"
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-300 text-center"
        >
          {t('leaderboard.btn.back')}
        </button>
      </div>
    </main>
  );
};
