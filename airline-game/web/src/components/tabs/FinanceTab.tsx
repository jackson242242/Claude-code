'use client';

import { Sparkline } from '@/components/Sparkline';
import { formatMoney } from '@/lib/format';
import type { GameState } from '@/types';

type FinanceTabProps = {
  state: GameState;
};

const formatShare = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;

const AI_BAR_COLORS = ['#64748b', '#7c6f9f', '#5b8a8a'];

type ShareRow = { key: string; label: string; share: number; color: string };

const MarketShareSection = ({ state }: { state: GameState }) => {
  const rows: ShareRow[] = [
    { key: 'player', label: state.airlineName, share: state.marketShare, color: '#22d3ee' },
    ...state.competitors.map((competitor, index) => ({
      key: competitor.id,
      label: competitor.nameZh,
      share: competitor.marketShare,
      color: AI_BAR_COLORS[index % AI_BAR_COLORS.length],
    })),
  ];
  const hasShares = rows.some((row) => row.share > 0);
  const remainder = Math.max(0, 1 - rows.reduce((sum, row) => sum + row.share, 0));

  return (
    <section className="panel p-3" data-testid="market-share">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        市场份额
      </h3>
      {hasShares ? (
        <ul className="flex flex-col gap-2">
          {[...rows, { key: 'background', label: '背景市场/其他航司', share: remainder, color: '#334155' }].map(
            (row) => (
              <li key={row.key} className="text-xs">
                <div className="mb-0.5 flex items-baseline justify-between">
                  <span className={row.key === 'player' ? 'font-semibold text-accent' : 'text-slate-400'}>
                    {row.label}
                  </span>
                  <span className="tabular-nums text-slate-300">{formatShare(row.share)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ops-700/60">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, row.share * 100)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </li>
            ),
          )}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">结算一个季度后显示。</p>
      )}
    </section>
  );
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

      <MarketShareSection state={state} />

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
