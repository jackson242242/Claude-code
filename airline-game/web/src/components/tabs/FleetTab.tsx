'use client';

import { MODEL_BY_ID, cityZh } from '@/lib/data';
import { formatMoney } from '@/lib/format';
import { useT } from '@/i18n';
import type { Command, GameState } from '@/types';

type FleetTabProps = {
  state: GameState;
  busy: boolean;
  onCommands: (commands: Command[]) => void;
};

export const FleetTab = ({ state, busy, onCommands }: FleetTabProps) => {
  const { t } = useT();
  const routeById = new Map(state.routes.map((route) => [route.id, route]));

  if (state.fleet.length === 0) {
    return (
      <p className="px-1 text-sm text-slate-500">
        {t('fleet.empty')}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {state.fleet.map((aircraft) => {
        const model = MODEL_BY_ID.get(aircraft.modelId);
        const route = aircraft.routeId ? routeById.get(aircraft.routeId) : undefined;
        const owned = aircraft.ownership === 'owned';
        return (
          <li key={aircraft.id} className="panel flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                {model ? `${model.manufacturer} ${model.name}` : aircraft.modelId}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    owned
                      ? 'bg-emerald-950 text-emerald-400'
                      : 'bg-sky-950 text-sky-300'
                  }`}
                >
                  {owned ? t('fleet.owned') : t('fleet.leased')}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {aircraft.id} ·{' '}
                {route
                  ? t('fleet.flying', { cityA: cityZh(route.cityA), cityB: cityZh(route.cityB) })
                  : t('fleet.idle')}
              </p>
            </div>
            {aircraft.routeId !== null && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  onCommands([{ type: 'assignAircraft', aircraftId: aircraft.id, routeId: null }])
                }
                className="btn-ghost px-2.5 py-1.5 text-xs"
              >
                {t('fleet.btn.unassign')}
              </button>
            )}
            {owned ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCommands([{ type: 'sellAircraft', aircraftId: aircraft.id }])}
                className="btn-danger px-2.5 py-1.5 text-xs"
                title={model ? t('fleet.sell.title', { amount: formatMoney(model.price * 0.7) }) : undefined}
              >
                {model
                  ? t('fleet.btn.sell', { amount: ` ${formatMoney(model.price * 0.7)}` })
                  : t('fleet.btn.sell', { amount: '' })}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCommands([{ type: 'returnLease', aircraftId: aircraft.id }])}
                className="btn-danger px-2.5 py-1.5 text-xs"
              >
                {t('fleet.btn.return')}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};
