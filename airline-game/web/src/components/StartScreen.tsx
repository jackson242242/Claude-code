'use client';

import { useState } from 'react';
import { CityCard } from '@/components/CityCard';
import { CITIES } from '@/lib/data';
import { useT } from '@/i18n';

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

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-glow">{t('start.tagline')}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('start.title')}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {t('start.subtitle')}
        </p>
      </header>

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
