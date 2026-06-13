'use client';

import { useState } from 'react';
import { CityCard } from '@/components/CityCard';
import { CITIES, CITY_BY_ID } from '@/lib/data';
import { useT } from '@/i18n';
import type { City } from '@/types';

// ── Types ────────────────────────────────────────────────────────────────────

type SubMode = 'create' | 'join';

export type CreateRoomParams = {
  airlineName: string;
  hqCityId: string;
  maxPlayers: 2 | 3 | 4;
  fillWithAI: boolean;
};

export type JoinRoomParams = {
  code: string;
  airlineName: string;
  hqCityId: string;
};

type MultiplayerSetupProps = {
  busy: boolean;
  error: string | null;
  onCreateRoom: (params: CreateRoomParams) => void;
  onJoinRoom: (params: JoinRoomParams) => void;
  onBack: () => void;
};

// ── HQ city picker (reused from StartScreen pattern) ─────────────────────────

type CityPickerProps = {
  selectedId: string | null;
  onSelect: (id: string) => void;
};

const CityPicker = ({ selectedId, onSelect }: CityPickerProps) => {
  const { t } = useT();
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filtered = CITIES.filter((city: City) => {
    if (!query) return true;
    return (
      city.name.toLowerCase().includes(query) ||
      city.nameZh.includes(query) ||
      city.country.toLowerCase().includes(query)
    );
  }).sort((a: City, b: City) => b.demandIndex - a.demandIndex);

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('start.placeholder.search')}
        aria-label={t('start.aria.search')}
        className="mb-3 w-full rounded-lg border border-ops-600 bg-ops-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-glow"
      />
      {filtered.length === 0 && (
        <p className="text-sm text-slate-500">{t('start.empty.cities')}</p>
      )}
      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
        {filtered.map((city: City) => (
          <CityCard
            key={city.id}
            city={city}
            selected={city.id === selectedId}
            onClick={() => onSelect(city.id)}
          />
        ))}
      </div>
    </div>
  );
};

// ── Create room sub-form ──────────────────────────────────────────────────────

type CreateFormProps = {
  busy: boolean;
  error: string | null;
  onSubmit: (params: CreateRoomParams) => void;
  onBack: () => void;
};

const CreateForm = ({ busy, error, onSubmit, onBack }: CreateFormProps) => {
  const { t } = useT();
  const [airlineName, setAirlineName] = useState('');
  const [hqCityId, setHqCityId] = useState<string | null>(null);
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(2);
  const [fillWithAI, setFillWithAI] = useState(true);

  const canSubmit = airlineName.trim().length > 0 && hqCityId !== null && !busy;

  const selectedCity = hqCityId ? CITY_BY_ID.get(hqCityId) : null;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-white">{t('match.create.heading')}</h2>

      <section className="panel p-4">
        <label htmlFor="mp-airline-name" className="text-sm font-semibold text-slate-300">
          {t('start.label.airlineName')}
        </label>
        <input
          id="mp-airline-name"
          data-testid="mp-airline-name"
          value={airlineName}
          onChange={(e) => setAirlineName(e.target.value)}
          maxLength={30}
          placeholder={t('start.placeholder.airlineName')}
          className="mt-2 w-full rounded-lg border border-ops-600 bg-ops-900 px-3 py-2.5 text-base text-white outline-none placeholder:text-slate-600 focus:border-glow"
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">{t('start.heading.hq')}</h3>
        <CityPicker selectedId={hqCityId} onSelect={setHqCityId} />
        {selectedCity && (
          <p className="mt-1 text-[11px] text-cyan-300">
            ✓ {selectedCity.nameZh} {selectedCity.name}
          </p>
        )}
      </section>

      <section className="panel flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-300">
            {t('match.create.maxPlayers')}
          </label>
          <div className="flex gap-1">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                data-testid={`max-players-${n}`}
                onClick={() => setMaxPlayers(n)}
                className={`rounded px-3 py-1 text-sm font-semibold transition ${
                  maxPlayers === n ? 'bg-accent text-white' : 'bg-ops-700 text-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            data-testid="fill-with-ai"
            checked={fillWithAI}
            onChange={(e) => setFillWithAI(e.target.checked)}
            className="h-4 w-4 rounded border-ops-600 bg-ops-900 text-accent"
          />
          {t('match.create.fillWithAI')}
        </label>
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-ops-600 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
        >
          {t('match.back')}
        </button>
        <button
          type="button"
          data-testid="create-room-btn"
          disabled={!canSubmit}
          onClick={() => {
            if (hqCityId && airlineName.trim()) {
              onSubmit({ airlineName: airlineName.trim(), hqCityId, maxPlayers, fillWithAI });
            }
          }}
          className="flex-1 btn-primary px-4 py-3 text-sm"
        >
          {busy ? t('match.create.btn.creating') : t('match.create.btn')}
        </button>
      </div>
    </div>
  );
};

// ── Join room sub-form ────────────────────────────────────────────────────────

type JoinFormProps = {
  busy: boolean;
  error: string | null;
  onSubmit: (params: JoinRoomParams) => void;
  onBack: () => void;
};

const JoinForm = ({ busy, error, onSubmit, onBack }: JoinFormProps) => {
  const { t } = useT();
  const [code, setCode] = useState('');
  const [airlineName, setAirlineName] = useState('');
  const [hqCityId, setHqCityId] = useState<string | null>(null);

  const selectedCity = hqCityId ? CITY_BY_ID.get(hqCityId) : null;
  const canSubmit =
    code.trim().length === 6 &&
    airlineName.trim().length > 0 &&
    hqCityId !== null &&
    !busy;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-white">{t('match.join.heading')}</h2>

      <section className="panel p-4">
        <label htmlFor="join-code" className="text-sm font-semibold text-slate-300">
          {t('match.join.code.label')}
        </label>
        <input
          id="join-code"
          data-testid="join-code-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
          maxLength={6}
          placeholder={t('match.join.code.placeholder')}
          className="mt-2 w-full rounded-lg border border-ops-600 bg-ops-900 px-3 py-2.5 font-mono text-lg uppercase tracking-widest text-white outline-none placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal focus:border-glow"
        />
      </section>

      <section className="panel p-4">
        <label htmlFor="join-airline-name" className="text-sm font-semibold text-slate-300">
          {t('start.label.airlineName')}
        </label>
        <input
          id="join-airline-name"
          data-testid="join-airline-name"
          value={airlineName}
          onChange={(e) => setAirlineName(e.target.value)}
          maxLength={30}
          placeholder={t('start.placeholder.airlineName')}
          className="mt-2 w-full rounded-lg border border-ops-600 bg-ops-900 px-3 py-2.5 text-base text-white outline-none placeholder:text-slate-600 focus:border-glow"
        />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">{t('start.heading.hq')}</h3>
        <CityPicker selectedId={hqCityId} onSelect={setHqCityId} />
        {selectedCity && (
          <p className="mt-1 text-[11px] text-cyan-300">
            ✓ {selectedCity.nameZh} {selectedCity.name}
          </p>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-ops-600 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
        >
          {t('match.back')}
        </button>
        <button
          type="button"
          data-testid="join-room-btn"
          disabled={!canSubmit}
          onClick={() => {
            if (hqCityId && airlineName.trim() && code.trim().length === 6) {
              onSubmit({ code: code.trim(), airlineName: airlineName.trim(), hqCityId });
            }
          }}
          className="flex-1 btn-primary px-4 py-3 text-sm"
        >
          {busy ? t('match.join.btn.joining') : t('match.join.btn')}
        </button>
      </div>
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────

export const MultiplayerSetup = ({
  busy,
  error,
  onCreateRoom,
  onJoinRoom,
  onBack,
}: MultiplayerSetupProps) => {
  const { t } = useT();
  const [subMode, setSubMode] = useState<SubMode | null>(null);

  if (subMode === 'create') {
    return (
      <main
        data-testid="multiplayer-setup"
        className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8"
      >
        <CreateForm
          busy={busy}
          error={error}
          onSubmit={onCreateRoom}
          onBack={() => setSubMode(null)}
        />
      </main>
    );
  }

  if (subMode === 'join') {
    return (
      <main
        data-testid="multiplayer-setup"
        className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8"
      >
        <JoinForm
          busy={busy}
          error={error}
          onSubmit={onJoinRoom}
          onBack={() => setSubMode(null)}
        />
      </main>
    );
  }

  // Top-level sub-mode picker
  return (
    <main
      data-testid="multiplayer-setup"
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 py-8"
    >
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-glow">SkyEmpire · V3.3</p>
        <h1 className="mt-2 text-2xl font-bold text-white">{t('mode.select.multi')}</h1>
      </header>

      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          data-testid="create-room-option"
          onClick={() => setSubMode('create')}
          className="panel flex flex-col items-start p-4 hover:border-cyan-700 transition"
        >
          <span className="font-bold text-white">{t('match.create.btn')}</span>
          <span className="mt-1 text-xs text-slate-400">{t('match.create.heading')}</span>
        </button>
        <button
          type="button"
          data-testid="join-room-option"
          onClick={() => setSubMode('join')}
          className="panel flex flex-col items-start p-4 hover:border-cyan-700 transition"
        >
          <span className="font-bold text-white">{t('match.join.btn')}</span>
          <span className="mt-1 text-xs text-slate-400">{t('match.join.heading')}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        data-testid="mp-back-btn"
        className="mt-2 text-sm text-slate-500 hover:text-slate-300"
      >
        {t('match.back')}
      </button>
    </main>
  );
};

// ── Mode select (entry point shown on StartScreen) ────────────────────────────

type ModeSelectProps = {
  onSolo: () => void;
  onMulti: () => void;
};

export const ModeSelect = ({ onSolo, onMulti }: ModeSelectProps) => {
  const { t } = useT();
  return (
    <main
      data-testid="mode-select"
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 py-8"
    >
      <header className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-glow">SkyEmpire · 2026 Q3</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{t('start.title')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t('mode.select.heading')}</p>
      </header>

      <div className="flex w-full flex-col gap-4">
        <button
          type="button"
          data-testid="mode-solo-btn"
          onClick={onSolo}
          className="panel flex flex-col items-start p-5 hover:border-cyan-700 transition text-left"
        >
          <span className="text-lg font-bold text-white">✈ {t('mode.select.solo')}</span>
          <span className="mt-1 text-sm text-slate-400">{t('mode.select.solo.desc')}</span>
        </button>

        <button
          type="button"
          data-testid="mode-multi-btn"
          onClick={onMulti}
          className="panel flex flex-col items-start p-5 hover:border-cyan-700 transition text-left"
        >
          <span className="text-lg font-bold text-white">👥 {t('mode.select.multi')}</span>
          <span className="mt-1 text-sm text-slate-400">{t('mode.select.multi.desc')}</span>
        </button>
      </div>
    </main>
  );
};
