'use client';

import { MODEL_BY_ID, cityZh } from '@/lib/data';
import { formatMoney } from '@/lib/format';
import type { Command, GameState } from '@/types';

type FleetTabProps = {
  state: GameState;
  busy: boolean;
  onCommands: (commands: Command[]) => void;
};

export const FleetTab = ({ state, busy, onCommands }: FleetTabProps) => {
  const routeById = new Map(state.routes.map((route) => [route.id, route]));

  if (state.fleet.length === 0) {
    return (
      <p className="px-1 text-sm text-slate-500">
        机队为空。前往「机型市场」购买或租赁你的第一架飞机。
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
                  {owned ? '自有' : '租赁'}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {aircraft.id} ·{' '}
                {route
                  ? `执飞 ${cityZh(route.cityA)} ⇌ ${cityZh(route.cityB)}`
                  : '闲置（仍产生持有成本）'}
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
                取消指派
              </button>
            )}
            {owned ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCommands([{ type: 'sellAircraft', aircraftId: aircraft.id }])}
                className="btn-danger px-2.5 py-1.5 text-xs"
                title={model ? `残值 ${formatMoney(model.price * 0.7)}` : undefined}
              >
                出售{model ? ` ${formatMoney(model.price * 0.7)}` : ''}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onCommands([{ type: 'returnLease', aircraftId: aircraft.id }])}
                className="btn-danger px-2.5 py-1.5 text-xs"
              >
                退租
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};
