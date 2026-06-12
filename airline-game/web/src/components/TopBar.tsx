'use client';

import { formatMoney } from '@/lib/format';
import type { GameState } from '@/types';

type TopBarProps = {
  state: GameState;
  busy: boolean;
  onEndTurn: () => void;
};

export const TopBar = ({ state, busy, onEndTurn }: TopBarProps) => (
  <header className="flex items-center gap-3 border-b border-ops-700 bg-ops-900/95 px-3 py-2.5 backdrop-blur">
    <div className="min-w-0 flex-1">
      <h1 className="truncate text-sm font-bold text-white">{state.airlineName}</h1>
      <p className="text-[11px] tracking-wider text-slate-500">
        {state.year} Q{state.quarter} · 第 {state.turn} 回合
      </p>
    </div>
    <div className="text-right">
      <p
        className={`text-base font-bold tabular-nums ${
          state.cash < 0 ? 'text-red-400' : 'text-accent'
        }`}
        data-testid="cash"
      >
        {formatMoney(state.cash)}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-slate-500">现金</p>
    </div>
    <button
      type="button"
      onClick={onEndTurn}
      disabled={busy || state.status !== 'active'}
      className="btn-primary px-3.5 py-2 text-sm"
    >
      {busy ? '结算中…' : '下一季度 ▸'}
    </button>
  </header>
);
