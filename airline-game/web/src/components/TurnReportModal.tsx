'use client';

import { cityZh } from '@/lib/data';
import { formatMoney, formatPercent } from '@/lib/format';
import type { GameState, TurnReport } from '@/types';

type TurnReportModalProps = {
  report: TurnReport;
  state: GameState;
  onClose: () => void;
};

export const TurnReportModal = ({ report, state, onClose }: TurnReportModalProps) => {
  const routeById = new Map(state.routes.map((route) => [route.id, route]));
  const routeName = (routeId: string): string => {
    const route = routeById.get(routeId);
    return route ? `${cityZh(route.cityA)} ⇌ ${cityZh(route.cityB)}` : routeId;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="季度报告"
    >
      <div className="panel max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-b-none p-4 sm:rounded-xl">
        <header className="mb-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-glow">季度报告</p>
          <h2 className="mt-1 text-xl font-bold text-white">
            {report.year} Q{report.quarter}
          </h2>
        </header>

        <section className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="panel p-2.5">
            <p className="text-[10px] text-slate-500">收入</p>
            <p className="text-sm font-bold text-slate-200">{formatMoney(report.totals.revenue)}</p>
          </div>
          <div className="panel p-2.5">
            <p className="text-[10px] text-slate-500">成本</p>
            <p className="text-sm font-bold text-slate-200">{formatMoney(report.totals.cost)}</p>
          </div>
          <div className="panel p-2.5">
            <p className="text-[10px] text-slate-500">净利</p>
            <p
              className={`text-sm font-bold ${
                report.totals.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {formatMoney(report.totals.profit)}
            </p>
          </div>
        </section>

        {report.routeStats.length > 0 && (
          <section className="mb-3">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              航线表现
            </h3>
            <ul className="flex flex-col gap-1.5">
              {report.routeStats.map((stats) => (
                <li
                  key={stats.routeId}
                  className="flex items-center justify-between gap-2 rounded-lg bg-ops-900/80 px-2.5 py-2 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-200">
                    {routeName(stats.routeId)}
                  </span>
                  <span className="tabular-nums text-glow">
                    {formatPercent(stats.loadFactor)}
                  </span>
                  <span
                    className={`w-16 text-right font-bold tabular-nums ${
                      stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatMoney(stats.profit)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {report.news.length > 0 && (
          <section className="mb-3">
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              新闻播报
            </h3>
            <ul className="flex flex-col gap-1.5">
              {report.news.map((item, index) => (
                <li key={`${index}-${item.headline}`} className="rounded-lg bg-ops-900/80 px-2.5 py-2">
                  <p className="text-xs font-semibold text-slate-200">{item.headline}</p>
                  {item.detail && <p className="mt-0.5 text-[11px] text-slate-500">{item.detail}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <button type="button" onClick={onClose} className="btn-primary w-full px-4 py-3 text-sm">
          继续经营 ▸
        </button>
      </div>
    </div>
  );
};
