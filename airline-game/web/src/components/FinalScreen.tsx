'use client';

import { formatMoney } from '@/lib/format';
import type { FinalResult } from '@/types';

type FinalScreenProps = {
  airlineName: string;
  finalResult: FinalResult;
  onRestart: () => void;
};

const MEDAL = ['🥇', '🥈', '🥉', '4️⃣'] as const;

const formatPax = (pax: number): string => {
  if (pax >= 1_000_000) {
    const val = pax / 1_000_000;
    const text =
      val >= 100
        ? String(Math.round(val))
        : (Math.round(val * 10) / 10).toFixed(1).replace(/\.0$/, '');
    return `${text}M 人次`;
  }
  if (pax >= 1_000) {
    const val = pax / 1_000;
    const text =
      val >= 100
        ? String(Math.round(val))
        : (Math.round(val * 10) / 10).toFixed(1).replace(/\.0$/, '');
    return `${text}K 人次`;
  }
  return `${Math.round(pax)} 人次`;
};

export const FinalScreen = ({ airlineName, finalResult, onRestart }: FinalScreenProps) => {
  const { victory, rank, standings, cumulativeProfit, cumulativePax, endedTurn } = finalResult;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label="游戏结束 — 终局结算"
    >
      <div className="panel mx-4 w-full max-w-md p-6">
        {/* header */}
        <div className="text-center">
          {victory ? (
            <>
              <p className="text-5xl">🏆</p>
              <h2
                className="mt-3 text-2xl font-bold text-amber-400"
                data-testid="final-headline"
              >
                称霸蓝天
              </h2>
              <p className="mt-1 text-sm text-amber-300/80">{airlineName} 以第 1 名傲视群雄</p>
            </>
          ) : (
            <>
              <p className="text-5xl">✈️</p>
              <h2
                className="mt-3 text-xl font-bold text-slate-300"
                data-testid="final-headline"
              >
                航程终止
              </h2>
              <p className="mt-1 text-sm text-slate-400" data-testid="defeat-rank">
                {airlineName} 最终排名：第 {rank} 名
              </p>
            </>
          )}
        </div>

        {/* standings */}
        <div className="mt-5" data-testid="standings">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            最终排名
          </p>
          <ul className="space-y-1.5">
            {standings.map((entry, i) => (
              <li
                key={entry.name}
                data-testid={`standing-row-${i}`}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                  entry.isPlayer
                    ? 'border border-cyan-700 bg-cyan-950/60 text-cyan-300'
                    : 'text-slate-400'
                }`}
              >
                <span className="w-6 text-center text-base">{MEDAL[i]}</span>
                <span className="flex-1 truncate font-medium">{entry.name}</span>
                <span className="tabular-nums text-slate-400">
                  {(entry.marketShare * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* lifetime stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded border border-ops-700 bg-ops-900/60 p-2.5 text-center">
            <p className="text-xs text-slate-500">累计利润</p>
            <p
              className={`mt-0.5 text-base font-bold tabular-nums ${
                cumulativeProfit < 0 ? 'text-red-400' : 'text-accent'
              }`}
              data-testid="cumulative-profit"
            >
              {formatMoney(cumulativeProfit)}
            </p>
          </div>
          <div className="rounded border border-ops-700 bg-ops-900/60 p-2.5 text-center">
            <p className="text-xs text-slate-500">累计乘客</p>
            <p
              className="mt-0.5 text-base font-bold tabular-nums text-accent"
              data-testid="cumulative-pax"
            >
              {formatPax(cumulativePax)}
            </p>
          </div>
        </div>

        {/* footer */}
        <p className="mt-3 text-center text-[11px] text-slate-600">
          20 年 / {endedTurn} 回合
        </p>

        {/* restart */}
        <button
          type="button"
          onClick={onRestart}
          data-testid="restart-button"
          className="btn-primary mt-4 w-full px-4 py-3 text-sm"
        >
          再来一局
        </button>
      </div>
    </div>
  );
};
