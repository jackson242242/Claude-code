'use client';

import { useEffect, useMemo, useState } from 'react';
import { SlotBadge } from '@/components/SlotBadge';
import { CITIES, CITY_BY_ID, MODEL_BY_ID, cityZh } from '@/lib/data';
import { formatKm, formatMoney, formatPercent } from '@/lib/format';
import { hasFreeHeldSlot, isPoolFull, slotNegotiationCost } from '@/lib/slots';
import type { Command, GameState, Route } from '@/types';

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
          {cityId === state.hqCityId ? '（枢纽）' : ''}
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
          {full ? '池已满' : `谈判获取 slot · ${formatMoney(cost)}`}
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
  const [fareMult, setFareMult] = useState(route.fareMult);
  const [assignPick, setAssignPick] = useState('');

  // Re-sync local slider state whenever the server state replaces the route.
  useEffect(() => {
    setFareMult(route.fareMult);
  }, [route.fareMult]);

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

  const commitFare = () => {
    if (Math.abs(fareMult - route.fareMult) > 1e-9) {
      onCommands([{ type: 'updateRoute', routeId: route.id, fareMult }]);
    }
  };

  const stats = route.lastQuarter;

  return (
    <div className="flex flex-col gap-3 border-t border-ops-700 p-3">
      {/* assigned aircraft */}
      <section>
        <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          已指派飞机（{assigned.length}）
        </h4>
        {assigned.length === 0 && (
          <p className="text-xs text-amber-400/80">尚未指派飞机 — 本航线不产生运力。</p>
        )}
        <ul className="flex flex-wrap gap-1.5">
          {assigned.map((aircraft) => (
            <li
              key={aircraft.id}
              className="flex items-center gap-1.5 rounded-full border border-ops-600 bg-ops-800 py-1 pl-2.5 pr-1 text-xs text-slate-200"
            >
              {MODEL_BY_ID.get(aircraft.modelId)?.name ?? aircraft.modelId}
              <span className="text-[10px] text-slate-500">
                {aircraft.ownership === 'owned' ? '自有' : '租赁'}
              </span>
              <button
                type="button"
                aria-label={`取消指派 ${aircraft.id}`}
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
            aria-label="选择要指派的飞机"
            className="min-w-0 flex-1 rounded-lg border border-ops-600 bg-ops-900 px-2 py-1.5 text-xs text-slate-200"
          >
            <option value="">选择闲置飞机…</option>
            {assignable.map((aircraft) => {
              const model = MODEL_BY_ID.get(aircraft.modelId);
              return (
                <option key={aircraft.id} value={aircraft.id}>
                  {model?.name ?? aircraft.modelId} · {aircraft.ownership === 'owned' ? '自有' : '租赁'}
                  {aircraft.routeId ? '（已在其他航线）' : ''}
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
            指派
          </button>
        </div>
      </section>

      {/* weekly flights stepper */}
      <section className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          每周班次（单向）
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="减少班次"
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
            aria-label="增加班次"
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
            票价系数
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
          aria-label="票价系数"
          onChange={(event) => setFareMult(Number(event.target.value))}
          onPointerUp={commitFare}
          onKeyUp={commitFare}
          onBlur={commitFare}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>0.6 低价抢客</span>
          <span>1.6 高价精品</span>
        </div>
      </section>

      {/* last quarter stats */}
      <section className="rounded-lg bg-ops-900/80 p-2.5">
        <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          上季度表现
        </h4>
        {stats ? (
          <div className="grid grid-cols-3 gap-1 text-center">
            <div>
              <p className="text-[10px] text-slate-500">客座率</p>
              <p className="text-sm font-bold text-glow">{formatPercent(stats.loadFactor)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">客流</p>
              <p className="text-sm font-bold text-slate-200">
                {Math.round(stats.pax).toLocaleString('en-US')}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500">利润</p>
              <p
                className={`text-sm font-bold ${stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {formatMoney(stats.profit)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">新航线 — 结算后显示数据。</p>
        )}
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={() => onCommands([{ type: 'closeRoute', routeId: route.id }])}
        className="btn-danger self-end px-3 py-1.5 text-xs"
      >
        关闭航线
      </button>
    </div>
  );
};

export const RoutesTab = ({ state, busy, selectedCityId, onCommands }: RoutesTabProps) => {
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
          开通新航线 · 枢纽 {cityZh(state.hqCityId)}
        </h3>
        <div className="flex gap-2">
          <select
            value={destPick}
            onChange={(event) => setDestPick(event.target.value)}
            aria-label="选择目的地城市"
            className="min-w-0 flex-1 rounded-lg border border-ops-600 bg-ops-900 px-2 py-2 text-sm text-slate-200"
          >
            <option value="">选择目的地（或点击地图城市）…</option>
            {candidates.map((city) => (
              <option key={city.id} value={city.id}>
                {city.nameZh} {city.name} · 需求 {city.demandIndex}/10
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
            开通
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
              两端都需要 1 个空闲持有 slot 才能开航 — 先通过谈判获取。
            </p>
          )}
        </div>
      </section>

      {state.routes.length === 0 && (
        <p className="px-1 text-sm text-slate-500">
          还没有航线。开通一条从枢纽出发的航线，并指派飞机开始运营。
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
                    {formatKm(route.distanceKm)} · {route.aircraftIds.length} 架 ·{' '}
                    {route.weeklyFlights} 班/周 · ×{route.fareMult.toFixed(2)}
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
