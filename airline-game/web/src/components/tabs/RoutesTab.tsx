'use client';

import { useEffect, useMemo, useState } from 'react';
import { SlotBadge } from '@/components/SlotBadge';
import { CITIES, CITY_BY_ID, MODEL_BY_ID, cityZh } from '@/lib/data';
import { formatKm, formatMoney, formatPercent } from '@/lib/format';
import { hasFreeHeldSlot, isPoolFull, slotNegotiationCost } from '@/lib/slots';
import { SERVICE_TIERS, seatBreakdown, validateMix } from '@/lib/cabin';
import { useT } from '@/i18n';
import type { CabinMix, Command, GameState, Route } from '@/types';

type RoutesTabProps = {
  state: GameState;
  busy: boolean;
  selectedCityId: string | null;
  onCommands: (commands: Command[]) => void;
};

const routeTitle = (route: Route): string => `${cityZh(route.cityA)} ⇌ ${cityZh(route.cityB)}`;

// One end city of the route being opened: slot chips + inline 谈判 when a free
// held slot is missing (CONTRACT §3 — 开航前两端都必须有空闲持有 slot).
type SlotEndRowProps = {
  cityId: string;
  state: GameState;
  busy: boolean;
  onCommands: (commands: Command[]) => void;
};

const SlotEndRow = ({ cityId, state, busy, onCommands }: SlotEndRowProps) => {
  const { t } = useT();
  const info = state.slotMarket[cityId];
  const city = CITY_BY_ID.get(cityId);
  if (!info || !city) return null;

  const full = isPoolFull(info);
  const cost = slotNegotiationCost(city.slotFee, info);

  return (
    <div
      data-testid={`slot-end-${cityId}`}
      className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1"
    >
      <span className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-300">
          {cityZh(cityId)}
          {cityId === state.hqCityId ? t('routes.hq.tag') : ''}
        </span>
        <SlotBadge cityId={cityId} info={info} />
      </span>
      {!hasFreeHeldSlot(info) && (
        <button
          type="button"
          disabled={busy || full || state.cash < cost}
          onClick={() => onCommands([{ type: 'negotiateSlot', cityId }])}
          className="btn-ghost px-2.5 py-1 text-[11px]"
        >
          {full
            ? t('routes.slot.full')
            : t('routes.slot.negotiate', { cost: formatMoney(cost) })}
        </button>
      )}
    </div>
  );
};

type RoutePanelProps = {
  route: Route;
  state: GameState;
  busy: boolean;
  onCommands: (commands: Command[]) => void;
};

const RoutePanel = ({ route, state, busy, onCommands }: RoutePanelProps) => {
  const { t } = useT();
  const [fareMult, setFareMult] = useState(route.fareMult);
  const [assignPick, setAssignPick] = useState('');

  // Cabin-mix draft state (percentages as strings for input editing).
  const [cabinDraft, setCabinDraft] = useState<CabinMix>(
    route.cabinMix ?? { economy: 100, business: 0, first: 0 },
  );
  const [serviceTier, setServiceTier] = useState<1 | 2 | 3>(route.serviceTier ?? 2);

  // Re-sync local slider state whenever the server state replaces the route.
  useEffect(() => {
    setFareMult(route.fareMult);
  }, [route.fareMult]);

  // Re-sync cabin/tier when server state updates.
  useEffect(() => {
    setCabinDraft(route.cabinMix ?? { economy: 100, business: 0, first: 0 });
    setServiceTier(route.serviceTier ?? 2);
  }, [route.cabinMix, route.serviceTier]);

  const assignable = useMemo(
    () =>
      state.fleet.filter((aircraft) => {
        if (aircraft.routeId === route.id) return false;
        const model = MODEL_BY_ID.get(aircraft.modelId);
        return model !== undefined && model.rangeKm >= route.distanceKm;
      }),
    [route.distanceKm, route.id, state.fleet],
  );

  const assigned = state.fleet.filter((aircraft) => aircraft.routeId === route.id);

  const cabinMixValid = validateMix(cabinDraft);
  const cabinSum = cabinDraft.economy + cabinDraft.business + cabinDraft.first;

  // Seat preview: average over assigned aircraft (or 0 when none).
  const assignedSeats = assigned
    .map((ac) => MODEL_BY_ID.get(ac.modelId)?.seats ?? 0)
    .filter((s) => s > 0);
  const previewSeats =
    assignedSeats.length > 0
      ? seatBreakdown(Math.round(assignedSeats.reduce((a, b) => a + b, 0) / assignedSeats.length), cabinDraft)
      : null;

  const commitFare = () => {
    if (Math.abs(fareMult - route.fareMult) > 1e-9) {
      onCommands([{ type: 'updateRoute', routeId: route.id, fareMult }]);
    }
  };

  const commitCabin = () => {
    if (!cabinMixValid) return;
    const mixChanged =
      cabinDraft.economy !== (route.cabinMix?.economy ?? 100) ||
      cabinDraft.business !== (route.cabinMix?.business ?? 0) ||
      cabinDraft.first !== (route.cabinMix?.first ?? 0);
    const tierChanged = serviceTier !== (route.serviceTier ?? 2);
    if (mixChanged || tierChanged) {
      onCommands([
        {
          type: 'updateRoute',
          routeId: route.id,
          cabinMix: cabinDraft,
          serviceTier,
        },
      ]);
    }
  };

  const stats = route.lastQuarter;

  return (
    <div className="flex flex-col gap-3 border-t border-ops-700 p-3">
      {/* assigned aircraft */}
      <section>
        <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t('routes.assigned.heading', { n: assigned.length })}
        </h4>
        {assigned.length === 0 && (
          <p className="text-xs text-amber-400/80">{t('routes.assigned.none')}</p>
        )}
        <ul className="flex flex-wrap gap-1.5">
          {assigned.map((aircraft) => (
            <li
              key={aircraft.id}
              className="flex items-center gap-1.5 rounded-full border border-ops-600 bg-ops-800 py-1 pl-2.5 pr-1 text-xs text-slate-200"
            >
              {MODEL_BY_ID.get(aircraft.modelId)?.name ?? aircraft.modelId}
              <span className="text-[10px] text-slate-500">
                {aircraft.ownership === 'owned' ? t('routes.aircraft.owned') : t('routes.aircraft.leased')}
              </span>
              <button
                type="button"
                aria-label={t('routes.unassign.aria', { aircraftId: aircraft.id })}
                disabled={busy}
                onClick={() =>
                  onCommands([{ type: 'assignAircraft', aircraftId: aircraft.id, routeId: null }])
                }
                className="rounded-full px-1.5 text-slate-500 hover:text-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <select
            value={assignPick}
            onChange={(event) => setAssignPick(event.target.value)}
            aria-label={t('routes.assign.aria')}
            className="min-w-0 flex-1 rounded-lg border border-ops-600 bg-ops-900 px-2 py-1.5 text-xs text-slate-200"
          >
            <option value="">{t('routes.assign.placeholder')}</option>
            {assignable.map((aircraft) => {
              const model = MODEL_BY_ID.get(aircraft.modelId);
              return (
                <option key={aircraft.id} value={aircraft.id}>
                  {model?.name ?? aircraft.modelId} · {aircraft.ownership === 'owned' ? t('routes.aircraft.owned') : t('routes.aircraft.leased')}
                  {aircraft.routeId ? t('routes.aircraft.onOtherRoute') : ''}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            disabled={busy || assignPick === ''}
            onClick={() => {
              onCommands([{ type: 'assignAircraft', aircraftId: assignPick, routeId: route.id }]);
              setAssignPick('');
            }}
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            {t('routes.assign.btn')}
          </button>
        </div>
      </section>

      {/* weekly flights stepper */}
      <section className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t('routes.flights.heading')}
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('routes.flights.decrement')}
            disabled={busy || route.weeklyFlights <= 1}
            onClick={() =>
              onCommands([
                { type: 'updateRoute', routeId: route.id, weeklyFlights: route.weeklyFlights - 1 },
              ])
            }
            className="btn-ghost h-8 w-8 text-base leading-none"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-bold tabular-nums text-white">
            {route.weeklyFlights}
          </span>
          <button
            type="button"
            aria-label={t('routes.flights.increment')}
            disabled={busy}
            onClick={() =>
              onCommands([
                { type: 'updateRoute', routeId: route.id, weeklyFlights: route.weeklyFlights + 1 },
              ])
            }
            className="btn-ghost h-8 w-8 text-base leading-none"
          >
            ＋
          </button>
        </div>
      </section>

      {/* fare multiplier slider */}
      <section>
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t('routes.fare.heading')}
          </h4>
          <span className="text-sm font-bold tabular-nums text-accent">×{fareMult.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.6}
          max={1.6}
          step={0.05}
          value={fareMult}
          disabled={busy}
          aria-label={t('routes.fare.aria')}
          onChange={(event) => setFareMult(Number(event.target.value))}
          onPointerUp={commitFare}
          onKeyUp={commitFare}
          onBlur={commitFare}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>{t('routes.fare.low')}</span>
          <span>{t('routes.fare.high')}</span>
        </div>
      </section>

      {/* cabin mix editor — M2.3 */}
      <section aria-label={t('routes.cabin.aria')}>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t('routes.cabin.heading')}
        </h4>
        <div className="flex flex-col gap-2">
          {(['economy', 'business', 'first'] as const).map((key) => {
            const cabinLabelKey = {
              economy: 'cabin.economy',
              business: 'cabin.business',
              first: 'cabin.first',
            } as const;
            const label = t(cabinLabelKey[key]);
            return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-8 text-xs text-slate-400">{label}</span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                aria-label={`${label} %`}
                value={cabinDraft[key]}
                disabled={busy}
                onChange={(event) => {
                  const val = Math.max(0, Math.min(100, Math.round(Number(event.target.value))));
                  setCabinDraft((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
                }}
                className="w-16 rounded-lg border border-ops-600 bg-ops-900 px-2 py-1 text-center text-xs text-slate-200"
              />
              <span className="text-xs text-slate-500">%</span>
              {previewSeats && (
                <span className="ml-1 text-[11px] text-slate-500">
                  → {previewSeats[key]} 座
                </span>
              )}
            </div>
            );
          })}
        </div>
        {!cabinMixValid && cabinSum !== 100 && (
          <p
            data-testid="cabin-sum-error"
            className="mt-1.5 text-[11px] text-red-400"
          >
            {t('routes.cabin.error', { sum: cabinSum })}
          </p>
        )}

        {/* service tier segmented control */}
        <h4 className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t('routes.service.heading')}
        </h4>
        <div className="flex gap-1.5" role="group" aria-label={t('routes.service.aria')}>
          {SERVICE_TIERS.map(({ tier, hint }) => {
            const serviceLabelKey = {
              1: 'cabin.service.economy',
              2: 'cabin.service.standard',
              3: 'cabin.service.premium',
            } as const;
            const serviceLabel = t(serviceLabelKey[tier]);
            return (
              <button
                key={tier}
                type="button"
                aria-label={serviceLabel}
                title={hint}
                disabled={busy}
                onClick={() => setServiceTier(tier)}
                className={`flex-1 rounded-lg border py-1.5 text-xs transition-colors ${
                  serviceTier === tier
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-ops-600 bg-ops-900 text-slate-400 hover:border-slate-500'
                }`}
              >
                {tier} {serviceLabel}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          data-testid="cabin-confirm"
          disabled={busy || !cabinMixValid}
          onClick={commitCabin}
          className="btn-ghost mt-2.5 w-full py-1.5 text-xs"
        >
          {t('routes.cabin.confirm')}
        </button>
      </section>

      {/* last quarter stats */}
      <section className="rounded-lg bg-ops-900/80 p-2.5">
        <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t('routes.lastQ.heading')}
        </h4>
        {stats ? (
          <div className="grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="text-[10px] text-slate-500">{t('routes.lastQ.loadFactor')}</p>
              <p className="text-sm font-bold text-glow">{formatPercent(stats.loadFactor)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">{t('routes.lastQ.pax')}</p>
              <p className="text-sm font-bold text-slate-200">
                {Math.round(stats.pax).toLocaleString('en-US')}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">{t('routes.lastQ.profit')}</p>
              <p
                className={`text-sm font-bold ${stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {formatMoney(stats.profit)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">{t('routes.lastQ.empty')}</p>
        )}
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={() => onCommands([{ type: 'closeRoute', routeId: route.id }])}
        className="btn-danger self-end px-3 py-1.5 text-xs"
      >
        {t('routes.btn.close')}
      </button>
    </div>
  );
};

export const RoutesTab = ({ state, busy, selectedCityId, onCommands }: RoutesTabProps) => {
  const { t } = useT();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [destPick, setDestPick] = useState('');

  const connected = useMemo(
    () =>
      new Set(
        state.routes.flatMap((route) => [route.cityA, route.cityB]).filter((id) => id !== state.hqCityId),
      ),
    [state.hqCityId, state.routes],
  );

  const candidates = useMemo(
    () => CITIES.filter((city) => city.id !== state.hqCityId && !connected.has(city.id)),
    [connected, state.hqCityId],
  );

  // Map taps feed the destination picker (one end is always HQ in M1).
  useEffect(() => {
    if (selectedCityId && candidates.some((city) => city.id === selectedCityId)) {
      setDestPick(selectedCityId);
    }
  }, [candidates, selectedCityId]);

  // M2.2 slot gate: both ends need a free held slot before 开通 unlocks.
  const routeEnds = destPick === '' ? [state.hqCityId] : [state.hqCityId, destPick];
  const slotsReady = routeEnds.every((cityId) => hasFreeHeldSlot(state.slotMarket[cityId]));

  return (
    <div className="flex flex-col gap-3">
      <section className="panel p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t('routes.open.heading', { hqCity: cityZh(state.hqCityId) })}
        </h3>
        <div className="flex gap-2">
          <select
            value={destPick}
            onChange={(event) => setDestPick(event.target.value)}
            aria-label={t('routes.dest.aria')}
            className="min-w-0 flex-1 rounded-lg border border-ops-600 bg-ops-900 px-2 py-2 text-sm text-slate-200"
          >
            <option value="">{t('routes.dest.placeholder')}</option>
            {candidates.map((city) => (
              <option key={city.id} value={city.id}>
                {t('routes.dest.option', { nameZh: city.nameZh, name: city.name, demand: city.demandIndex })}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || destPick === '' || !slotsReady}
            onClick={() => {
              onCommands([{ type: 'openRoute', cityA: state.hqCityId, cityB: destPick }]);
              setDestPick('');
            }}
            className="btn-primary px-4 py-2 text-sm"
          >
            {t('routes.btn.open')}
          </button>
        </div>

        {/* M2.2: slot status per route end + inline negotiation */}
        <div className="mt-2.5 flex flex-col gap-1.5">
          {routeEnds.map((cityId) => (
            <SlotEndRow
              key={cityId}
              cityId={cityId}
              state={state}
              busy={busy}
              onCommands={onCommands}
            />
          ))}
          {destPick !== '' && !slotsReady && (
            <p className="text-[11px] text-amber-400/80">
              {t('routes.slot.gate')}
            </p>
          )}
        </div>
      </section>

      {state.routes.length === 0 && (
        <p className="px-1 text-sm text-slate-500">
          {t('routes.empty')}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {state.routes.map((route) => {
          const expanded = expandedId === route.id;
          return (
            <li key={route.id} className="panel overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : route.id)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-2 p-3 text-left"
              >
                <div>
                  <p className="text-sm font-bold text-white">{routeTitle(route)}</p>
                  <p className="text-[11px] text-slate-500">
                    {t('routes.subtitle', {
                      dist: formatKm(route.distanceKm),
                      aircraft: route.aircraftIds.length,
                      flights: route.weeklyFlights,
                      fare: route.fareMult.toFixed(2),
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {route.lastQuarter && (
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        route.lastQuarter.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {formatMoney(route.lastQuarter.profit)}
                    </span>
                  )}
                  <span className="text-slate-500">{expanded ? '▴' : '▾'}</span>
                </div>
              </button>
              {expanded && (
                <RoutePanel route={route} state={state} busy={busy} onCommands={onCommands} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
