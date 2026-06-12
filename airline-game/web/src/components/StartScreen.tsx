'use client';

import { useState } from 'react';
import { CITIES } from '@/lib/data';

type StartScreenProps = {
  busy: boolean;
  error: string | null;
  onCreate: (airlineName: string, hqCityId: string) => void;
};

const DemandDots = ({ value }: { value: number }) => (
  <span className="flex gap-0.5" aria-label={`需求指数 ${value}/10`}>
    {Array.from({ length: 10 }, (_, i) => (
      <span
        key={i}
        className={`h-1.5 w-1.5 rounded-full ${i < value ? 'bg-glow' : 'bg-ops-600'}`}
      />
    ))}
  </span>
);

export const StartScreen = ({ busy, error, onCreate }: StartScreenProps) => {
  const [airlineName, setAirlineName] = useState('');
  const [hqCityId, setHqCityId] = useState<string | null>(null);
  const canCreate = airlineName.trim().length > 0 && hqCityId !== null && !busy;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-glow">SkyEmpire · 2026 Q3</p>
        <h1 className="mt-2 text-3xl font-bold text-white">航空帝国</h1>
        <p className="mt-2 text-sm text-slate-400">
          创建你的航空公司，选择枢纽机场，开启回合制经营。起始资金 $420M。
        </p>
      </header>

      <section className="panel p-4">
        <label htmlFor="airline-name" className="text-sm font-semibold text-slate-300">
          航空公司名称
        </label>
        <input
          id="airline-name"
          value={airlineName}
          onChange={(event) => setAirlineName(event.target.value)}
          maxLength={30}
          placeholder="例如：环球之翼航空"
          className="mt-2 w-full rounded-lg border border-ops-600 bg-ops-900 px-3 py-2.5 text-base text-white outline-none placeholder:text-slate-600 focus:border-glow"
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">选择总部枢纽（HQ）</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CITIES.map((city) => {
            const selected = city.id === hqCityId;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setHqCityId(city.id)}
                aria-pressed={selected}
                className={`panel flex flex-col gap-1.5 p-3 text-left transition ${
                  selected
                    ? 'border-accent ring-1 ring-accent'
                    : 'hover:border-glow-dim'
                }`}
              >
                <span className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-white">{city.nameZh}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">
                    {city.country}
                  </span>
                </span>
                <span className="text-xs text-slate-400">{city.name}</span>
                <span className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <DemandDots value={city.demandIndex} />
                  <span className="text-glow">{city.demandIndex}/10</span>
                </span>
              </button>
            );
          })}
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
        {busy ? '创建中…' : '成立航空公司 ✈'}
      </button>
    </main>
  );
};
