'use client';

import { useState } from 'react';
import { CITY_IMAGES } from '@/lib/data';
import { useT } from '@/i18n';
import type { City } from '@/types';

// Deterministic gradient based on city id charCode sum — city-themed color pairs.
const GRADIENT_PAIRS: [string, string][] = [
  ['#1a3a5c', '#0d6e8a'], // deep ocean blue → teal
  ['#2d1b69', '#7b2d8b'], // indigo → purple
  ['#1a4731', '#2d8a5e'], // forest green → emerald
  ['#5c2a1a', '#c0692b'], // burnt sienna → amber
  ['#1a1a5c', '#2b4fc0'], // midnight blue → royal blue
  ['#3d1a5c', '#8b5cf6'], // deep violet → lavender
  ['#5c1a3a', '#c02b6e'], // deep rose → pink
  ['#1a4a4a', '#2b8a8a'], // dark teal → cyan
];

const getGradient = (cityId: string): [string, string] => {
  const sum = cityId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENT_PAIRS[sum % GRADIENT_PAIRS.length];
};

const DemandDots = ({ value }: { value: number }) => {
  const { t } = useT();
  return (
  <span className="flex gap-0.5" aria-label={t('city.aria.demand', { value })}>
    {Array.from({ length: 10 }, (_, i) => (
      <span
        key={i}
        className={`h-1.5 w-1.5 rounded-full ${i < value ? 'bg-glow' : 'bg-ops-600'}`}
      />
    ))}
  </span>
  );
};

// V3.9 endowment chips row
type EndowmentChipsProps = { city: City };

const EndowmentChips = ({ city }: EndowmentChipsProps) => {
  const { t, locale } = useT();

  const terrainKey = `city.terrain.${city.terrain}` as import('@/i18n').DictKeys;
  const terrainLabel = t(terrainKey);

  // transitIndex color: >6 cyan, <4 dim slate
  const transitColor =
    city.transitIndex > 6 ? 'text-cyan-400' : city.transitIndex < 4 ? 'text-slate-600' : 'text-slate-400';

  return (
    <span className="flex flex-wrap gap-1 text-[10px]">
      {/* Population */}
      <span className="rounded-full border border-ops-600 bg-ops-800 px-1.5 py-0.5 text-slate-400">
        {t('city.chip.population', { pop: city.population.toFixed(1) })}
      </span>

      {/* Tax relief — only when > 0 */}
      {city.taxRelief > 0 && (
        <span
          data-testid={`city-chip-tax-${city.id}`}
          className="rounded-full border border-cyan-800 bg-cyan-950/60 px-1.5 py-0.5 text-cyan-400"
        >
          {t('city.chip.taxRelief', { pct: Math.round(city.taxRelief * 100) })}
        </span>
      )}

      {/* Transit index */}
      <span
        data-testid={`city-chip-transit-${city.id}`}
        className={`rounded-full border border-ops-600 bg-ops-800 px-1.5 py-0.5 ${transitColor}`}
      >
        {t('city.chip.transit', { n: city.transitIndex })}
      </span>

      {/* Terrain */}
      <span
        data-testid={`city-chip-terrain-${city.id}`}
        className="rounded-full border border-ops-600 bg-ops-800 px-1.5 py-0.5 text-slate-400"
      >
        {locale === 'en'
          ? terrainLabel
          : locale === 'es'
            ? terrainLabel
            : terrainLabel}
      </span>
    </span>
  );
};

type CityCardProps = {
  city: City;
  selected: boolean;
  onClick: () => void;
};

export const CityCard = ({ city, selected, onClick }: CityCardProps) => {
  const { t, locale } = useT();
  const [imgError, setImgError] = useState(false);
  const imageEntry = CITY_IMAGES[city.id];
  const showImage = !!imageEntry && !imgError;
  const [from, to] = getGradient(city.id);

  // V3.9: airport name — zh locale uses airportZh, otherwise airport
  const airportName = locale === 'zh' ? city.airportZh : city.airport;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`panel flex flex-col overflow-hidden text-left transition ${
        selected ? 'border-accent ring-1 ring-accent' : 'hover:border-glow-dim'
      }`}
    >
      {/* Skyline photo or gradient placeholder */}
      <div className="relative h-16 w-full flex-none overflow-hidden">
        {showImage ? (
          <img
            src={imageEntry.url}
            alt={`${locale === 'zh' ? city.nameZh : city.name} skyline`}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            data-testid={`city-gradient-${city.id}`}
            className="h-full w-full"
            style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
          />
        )}
        {/* V3.9: IATA badge — top-right overlay */}
        <span
          data-testid={`city-iata-${city.id}`}
          className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm"
        >
          {city.iata}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        <span className="flex items-baseline justify-between">
          <span className="text-base font-bold text-white">
            {locale === 'zh' ? city.nameZh : city.name}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{city.country}</span>
        </span>
        <span className="text-xs text-slate-400">
          {locale === 'zh' ? city.name : city.nameZh}
        </span>

        {/* V3.9: Localized airport name */}
        <span
          data-testid={`city-airport-${city.id}`}
          className="truncate text-[10px] text-slate-500"
          title={airportName}
        >
          {airportName}
        </span>

        <span className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
          <DemandDots value={city.demandIndex} />
          <span className="text-glow">{city.demandIndex}/10</span>
        </span>
        <span className="flex flex-wrap gap-1 text-[10px] text-slate-500">
          <span className="rounded-full border border-ops-600 bg-ops-800 px-1.5 py-0.5">
            {t('city.chip.slots', { n: city.slotCapacity })}
          </span>
          <span className="rounded-full border border-ops-600 bg-ops-800 px-1.5 py-0.5">
            {t('city.chip.fee', { n: (city.slotFee / 1000).toFixed(0) })}
          </span>
        </span>

        {/* V3.9: Endowment chips */}
        <EndowmentChips city={city} />
      </div>
    </button>
  );
};
