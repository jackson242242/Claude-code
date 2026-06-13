'use client';

import { useEffect, useState } from 'react';
import { CityCard } from '@/components/CityCard';
import { CITIES } from '@/lib/data';
import { useT } from '@/i18n';
import { BADGES, TIER_COLORS } from '@/lib/badges';
import { loadProfile, getCeoLevel, getLevelProgress, CEO_LEVELS } from '@/lib/profile';
import { tStandalone, getLocale } from '@/i18n/standalone';
import type { CeoProfile } from '@/lib/profile';

type StartScreenProps = {
  busy: boolean;
  error: string | null;
  onCreate: (airlineName: string, hqCityId: string) => void;
};

export const StartScreen = ({ busy, error, onCreate }: StartScreenProps) => {
  const { t } = useT();
  const [airlineName, setAirlineName] = useState('');
  const [hqCityId, setHqCityId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState<CeoProfile | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);

  // Load profile on mount (client-only localStorage).
  useEffect(() => {
    setProfile(loadProfile());
  }, []);
  const canCreate = airlineName.trim().length > 0 && hqCityId !== null && !busy;

  const query = search.trim().toLowerCase();
  const filteredCities = CITIES.filter((city) => {
    if (!query) return true;
    return (
      city.name.toLowerCase().includes(query) ||
      city.nameZh.includes(query) ||
      city.country.toLowerCase().includes(query)
    );
  }).sort((a, b) => b.demandIndex - a.demandIndex);

  // Compute CEO level display from profile.
  const locale = getLocale();
  const ceoLevel = profile ? getCeoLevel(profile.xp) : 0;
  const levelTitle = tStandalone(locale, CEO_LEVELS[ceoLevel].titleKey);
  const { fraction, remaining, isMax } = profile
    ? getLevelProgress(profile.xp)
    : { fraction: 0, remaining: 0, isMax: false };
  const badgeCount = profile ? Object.keys(profile.badges).length : 0;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-glow">{t('start.tagline')}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('start.title')}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {t('start.subtitle')}
        </p>
      </header>

      {/* V3.8: CEO Profile panel */}
      {profile !== null && (
        <section
          data-testid="ceo-profile-panel"
          className="panel flex items-center gap-4 p-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                data-testid="ceo-level-title"
                className="text-sm font-bold text-accent"
              >
                {levelTitle}
              </span>
              <span className="text-xs text-slate-500">
                {t('profile.xp', { xp: profile.xp })}
              </span>
            </div>

            {/* XP bar */}
            <div
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ops-700"
              aria-label={
                isMax
                  ? t('profile.xp.maxLevel')
                  : t('profile.xp.nextLevel', { remaining })
              }
            >
              <div
                data-testid="xp-bar"
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.round(fraction * 100)}%` }}
              />
            </div>

            <p className="mt-1 text-[11px] text-slate-500">
              {isMax
                ? t('profile.xp.maxLevel')
                : t('profile.xp.nextLevel', { remaining })}
            </p>
          </div>

          {/* Badge count + achievements button */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-slate-400" data-testid="badge-count">
              {t('profile.badges.count', { n: badgeCount })}
            </span>
            <button
              type="button"
              data-testid="achievements-btn"
              onClick={() => setShowAchievements(true)}
              className="rounded bg-ops-700 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-ops-600"
            >
              {t('achievements.btn.open')}
            </button>
          </div>
        </section>
      )}

      {/* V3.8: Achievements modal */}
      {showAchievements && profile !== null && (
        <div
          data-testid="achievements-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t('achievements.heading')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur"
        >
          <div className="panel mx-4 flex w-full max-w-md flex-col gap-3 p-5 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{t('achievements.heading')}</h2>
              <button
                type="button"
                data-testid="achievements-close"
                onClick={() => setShowAchievements(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {BADGES.map((badge) => {
                const earnedAt = profile.badges[badge.id];
                const badgeName = tStandalone(locale, badge.nameKey);
                const badgeHint = tStandalone(locale, badge.hintKey);
                const color = TIER_COLORS[badge.tier];
                return (
                  <li
                    key={badge.id}
                    data-testid={`achievement-${badge.id}`}
                    className={`flex items-start gap-3 rounded-lg border p-2.5 ${
                      earnedAt
                        ? 'border-ops-600 bg-ops-800/60'
                        : 'border-ops-700/40 bg-ops-900/40 opacity-50'
                    }`}
                  >
                    <span
                      className="mt-0.5 text-xl"
                      style={{ filter: earnedAt ? 'none' : 'grayscale(100%)' }}
                    >
                      🏅
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: earnedAt ? color : '#6b7280' }}
                        >
                          {badgeName}
                        </span>
                        <span
                          className="rounded px-1 py-0.5 text-[9px] uppercase tracking-wider"
                          style={{
                            backgroundColor: `${color}22`,
                            color: earnedAt ? color : '#6b7280',
                          }}
                        >
                          {t(`badge.tier.${badge.tier}` as import('@/i18n').DictKeys)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{badgeHint}</p>
                    </div>
                    {earnedAt && (
                      <span className="text-[10px] text-emerald-400">✓</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <section className="panel p-4">
        <label htmlFor="airline-name" className="text-sm font-semibold text-slate-300">
          {t('start.label.airlineName')}
        </label>
        <input
          id="airline-name"
          value={airlineName}
          onChange={(event) => setAirlineName(event.target.value)}
          maxLength={30}
          placeholder={t('start.placeholder.airlineName')}
          className="mt-2 w-full rounded-lg border border-ops-600 bg-ops-900 px-3 py-2.5 text-base text-white outline-none placeholder:text-slate-600 focus:border-glow"
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">{t('start.heading.hq')}</h2>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('start.placeholder.search')}
          aria-label={t('start.aria.search')}
          className="mb-3 w-full rounded-lg border border-ops-600 bg-ops-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-glow"
        />

        {filteredCities.length === 0 && (
          <p className="text-sm text-slate-500">{t('start.empty.cities')}</p>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filteredCities.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              selected={city.id === hqCityId}
              onClick={() => setHqCityId(city.id)}
            />
          ))}
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!canCreate}
        onClick={() => hqCityId && onCreate(airlineName.trim(), hqCityId)}
        className="btn-primary sticky bottom-4 w-full px-4 py-3.5 text-base shadow-lg shadow-black/50"
      >
        {busy ? t('start.btn.creating') : t('start.btn.create')}
      </button>
    </main>
  );
};
