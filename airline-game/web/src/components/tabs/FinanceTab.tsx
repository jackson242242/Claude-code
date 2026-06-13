'use client';

import { useState } from 'react';
import { Sparkline } from '@/components/Sparkline';
import { formatMoney } from '@/lib/format';
import { useT } from '@/i18n';
import type { Command, GameState, Marketing } from '@/types';

type FinanceTabProps = {
  state: GameState;
  onCommands?: (commands: Command[]) => void;
};

const formatShare = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;

const AI_BAR_COLORS = ['#64748b', '#7c6f9f', '#5b8a8a'];

type ShareRow = { key: string; label: string; share: number; color: string };

const MarketShareSection = ({ state }: { state: GameState }) => {
  const { t, locale } = useT();
  const rows: ShareRow[] = [
    { key: 'player', label: state.airlineName, share: state.marketShare, color: '#22d3ee' },
    ...state.competitors.map((competitor, index) => ({
      key: competitor.id,
      label: locale === 'zh' ? competitor.nameZh : competitor.name,
      share: competitor.marketShare,
      color: AI_BAR_COLORS[index % AI_BAR_COLORS.length],
    })),
  ];
  const hasShares = rows.some((row) => row.share > 0);
  const remainder = Math.max(0, 1 - rows.reduce((sum, row) => sum + row.share, 0));

  return (
    <section className="panel p-3" data-testid="market-share">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {t('finance.share.heading')}
      </h3>
      {hasShares ? (
        <ul className="flex flex-col gap-2">
          {[...rows, { key: 'background', label: t('finance.share.background'), share: remainder, color: '#334155' }].map(
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
        <p className="text-xs text-slate-500">{t('finance.share.empty')}</p>
      )}
    </section>
  );
};

// ── V3.7 Brand section ───────────────────────────────────────────────────────

const BrandSection = ({ brand }: { brand: number }) => {
  const { t } = useT();
  const colorClass =
    brand < 35 ? 'text-red-400' : brand > 65 ? 'text-accent' : 'text-slate-300';

  return (
    <section className="panel p-3" data-testid="brand-section">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {t('brand.finance.heading')}
      </h3>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-[10px] text-slate-500">{t('brand.finance.value')}</span>
        <span className={`text-lg font-bold tabular-nums ${colorClass}`}>{Math.round(brand)}</span>
        <span className="text-[10px] text-slate-600">/ 100</span>
      </div>
      {/* Visual bar */}
      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-ops-700/60">
        <div
          data-testid="brand-bar"
          className={`h-full rounded-full transition-all ${
            brand < 35 ? 'bg-red-500' : brand > 65 ? 'bg-accent' : 'bg-slate-400'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, brand))}%` }}
        />
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">{t('brand.finance.effect')}</p>
    </section>
  );
};

// ── V3.7 Marketing panel ─────────────────────────────────────────────────────

type MarketingKey = keyof Marketing;

const MARKETING_KEYS: MarketingKey[] = ['digital', 'sponsor', 'service'];

const MarketingPanel = ({
  marketing,
  onCommands,
}: {
  marketing: Marketing;
  onCommands?: (commands: Command[]) => void;
}) => {
  const { t } = useT();
  const [draft, setDraft] = useState<Marketing>({ ...marketing });

  const clamp = (v: number) => Math.min(10, Math.max(0, Math.round(v)));

  const total = draft.digital + draft.sponsor + draft.service;

  const handleChange = (key: MarketingKey, raw: string) => {
    const n = clamp(parseInt(raw, 10) || 0);
    setDraft((prev) => ({ ...prev, [key]: n }));
  };

  const handleStep = (key: MarketingKey, dir: 1 | -1) => {
    setDraft((prev) => ({ ...prev, [key]: clamp(prev[key] + dir) }));
  };

  const handleConfirm = () => {
    onCommands?.([{ type: 'setMarketing', marketing: draft }]);
  };

  const hintKey = (key: MarketingKey) => `marketing.${key}.hint` as const;

  return (
    <section className="panel p-3" data-testid="marketing-panel">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {t('marketing.heading')}
      </h3>
      <ul className="flex flex-col gap-3">
        {MARKETING_KEYS.map((key) => (
          <li key={key}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-300">
                {t(`marketing.${key}` as const)}
              </span>
              <span className="text-[10px] text-slate-500">{t(hintKey(key))}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStep(key, -1)}
                aria-label={`Decrease ${key}`}
                disabled={draft[key] <= 0}
                className="flex h-7 w-7 items-center justify-center rounded border border-ops-600 text-slate-400 hover:text-white disabled:opacity-30"
              >
                −
              </button>
              <input
                type="number"
                data-testid={`marketing-input-${key}`}
                min={0}
                max={10}
                value={draft[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-14 rounded border border-ops-600 bg-ops-800 px-2 py-1 text-center text-sm tabular-nums text-slate-100 [appearance:textfield]"
              />
              <button
                type="button"
                onClick={() => handleStep(key, 1)}
                aria-label={`Increase ${key}`}
                disabled={draft[key] >= 10}
                className="flex h-7 w-7 items-center justify-center rounded border border-ops-600 text-slate-400 hover:text-white disabled:opacity-30"
              >
                +
              </button>
              <span className="text-xs text-slate-500">$M{t('marketing.per.quarter')}</span>
            </div>
          </li>
        ))}
      </ul>

      {/* Total + confirm */}
      <div className="mt-3 flex items-center justify-between border-t border-ops-700 pt-3">
        <span className="text-sm text-slate-400">
          {t('marketing.total')}{' '}
          <span className="font-bold tabular-nums text-slate-200">${total}M</span>
        </span>
        <button
          type="button"
          data-testid="marketing-confirm"
          onClick={handleConfirm}
          className="btn-primary px-3.5 py-1.5 text-sm"
        >
          {t('marketing.confirm')}
        </button>
      </div>
    </section>
  );
};

export const FinanceTab = ({ state, onCommands }: FinanceTabProps) => {
  const { t } = useT();
  const { lastQuarter, history } = state.finance;
  const cashSeries = history.map((entry) => entry.cash);

  return (
    <div className="flex flex-col gap-3" data-testid="finance-tab">
      <section className="panel p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t('finance.lastQ.heading')}
        </h3>
        {lastQuarter ? (
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-[10px] text-slate-500">{t('finance.lastQ.revenue')}</dt>
              <dd className="text-sm font-bold text-slate-200">{formatMoney(lastQuarter.revenue)}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-slate-500">{t('finance.lastQ.cost')}</dt>
              <dd className="text-sm font-bold text-slate-200">{formatMoney(lastQuarter.cost)}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-slate-500">{t('finance.lastQ.profit')}</dt>
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
          <p className="text-xs text-slate-500">{t('finance.lastQ.empty')}</p>
        )}
      </section>

      <MarketShareSection state={state} />

      {/* V3.7 Brand gauge */}
      <BrandSection brand={state.brand} />

      {/* V3.7 Marketing panel */}
      <MarketingPanel marketing={state.marketing} onCommands={onCommands} />

      <section className="panel p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('finance.cash.heading')}
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
            <span>{t('finance.history.turn', { turn: history[0].turn })}</span>
            <span>{t('finance.history.turn', { turn: history[history.length - 1].turn })}</span>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="panel p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('finance.history.heading')}
          </h3>
          <ul className="flex flex-col gap-1">
            {[...history].reverse().slice(0, 8).map((entry) => (
              <li
                key={entry.turn}
                className="flex items-center justify-between text-xs tabular-nums"
              >
                <span className="text-slate-500">{t('finance.history.turn', { turn: entry.turn })}</span>
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
