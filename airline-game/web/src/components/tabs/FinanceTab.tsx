'use client';

import { Sparkline } from '@/components/Sparkline';
import { formatMoney } from '@/lib/format';
import type { GameState } from '@/types';

type FinanceTabProps = {
  state: GameState;
};

export const FinanceTab = ({ state }: FinanceTabProps) => {
  const { lastQuarter, history } = state.finance;
  const cashSeries = history.map((entry) => entry.cash);

  return (
    <div className="flex flex-col gap-3">
      <section className="panel p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          上季度损益
        </h3>
        {lastQuarter ? (
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-[10px] text-slate-500">收入</dt>
              <dd className="text-sm font-bold text-slate-200">{formatMoney(lastQuarter.revenue)}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-slate-500">成本</dt>
              <dd className="text-sm font-bold text-slate-200">{formatMoney(lastQuarter.cost)}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-slate-500">净利</dt>
              <dd
                className={`text-sm font-bold ${
                  lastQuarter.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatMoney(lastQuarter.profit)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-slate-500">首个季度尚未结算。</p>
        )}
      </section>

      <section className="panel p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            现金走势
          </h3>
          <span
            className={`text-sm font-bold tabular-nums ${
              state.cash < 0 ? 'text-red-400' : 'text-accent'
            }`}
          >
            {formatMoney(state.cash)}
          </span>
        </div>
        <Sparkline values={cashSeries} />
        {history.length > 0 && (
          <div className="mt-1 flex justify-between text-[10px] text-slate-600">
            <span>回合 {history[0].turn}</span>
            <span>回合 {history[history.length - 1].turn}</span>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="panel p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            季度利润
          </h3>
          <ul className="flex flex-col gap-1">
            {[...history].reverse().slice(0, 8).map((entry) => (
              <li
                key={entry.turn}
                className="flex items-center justify-between text-xs tabular-nums"
              >
                <span className="text-slate-500">回合 {entry.turn}</span>
                <span className={entry.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatMoney(entry.profit)}
                </span>
                <span className="text-slate-400">{formatMoney(entry.cash)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
