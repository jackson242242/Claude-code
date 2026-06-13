'use client';

import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/lib/format';
import { voice } from '@/lib/voice';
import { useT } from '@/i18n';
import type { DecisionEvent, DecisionOption } from '@/types';

// Pick the best label for a DecisionOption based on locale.
const optionLabel = (opt: DecisionOption, locale: string): string => {
  if (locale === 'en' && opt.labelEn) return opt.labelEn;
  if (locale === 'es' && opt.labelEs) return opt.labelEs;
  return opt.label;
};

// Render brand impact as arrows + magnitude dots (↑↓ with dots).
const BrandArrow = ({ delta }: { delta: number }) => {
  if (delta === 0) return <span className="text-slate-500">—</span>;
  const positive = delta > 0;
  const abs = Math.abs(delta);
  // 1–5 → 1 dot, 6–10 → 2 dots, 11+ → 3 dots
  const dots = abs <= 5 ? 1 : abs <= 10 ? 2 : 3;
  return (
    <span className={positive ? 'text-emerald-400' : 'text-red-400'} aria-label={`${delta > 0 ? '+' : ''}${delta}`}>
      {positive ? '↑' : '↓'}
      {'•'.repeat(dots)}
    </span>
  );
};

type DecisionEventWithTurn = DecisionEvent & { drawnTurn: number };

type DecisionModalProps = {
  decision: DecisionEventWithTurn;
  onResolve: (optionId: string) => void;
};

export const DecisionModal = ({ decision, onResolve }: DecisionModalProps) => {
  const { t, locale } = useT();
  const [minimized, setMinimized] = useState(false);
  const spokenRef = useRef(false);

  // Pick localized prompt + detail.
  const prompt =
    (locale === 'en' && decision.promptEn) ||
    (locale === 'es' && decision.promptEs) ||
    decision.prompt;

  const detail =
    (locale === 'en' && decision.detailEn) ||
    (locale === 'es' && decision.detailEs) ||
    decision.detail;

  // Read the prompt aloud once on open.
  useEffect(() => {
    if (!spokenRef.current) {
      spokenRef.current = true;
      voice.speakDecision(prompt);
    }
  }, [prompt]);

  const handleResolve = (opt: DecisionOption) => {
    voice.speakDecisionResult(opt.brandDelta);
    onResolve(opt.id);
  };

  if (minimized) {
    return (
      <button
        type="button"
        data-testid="decision-chip"
        onClick={() => setMinimized(false)}
        aria-label={t('decision.restore')}
        className="fixed bottom-20 right-3 z-40 flex items-center gap-1.5 rounded-full border border-amber-700 bg-amber-950/90 px-3 py-1.5 text-[12px] font-semibold text-amber-300 shadow-lg backdrop-blur"
      >
        ⚡ {t('decision.restore')}
      </button>
    );
  }

  return (
    <div
      data-testid="decision-modal"
      className="fixed inset-0 z-45 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('decision.modal.aria')}
    >
      <div className="panel mx-4 w-full max-w-sm rounded-xl p-4 shadow-2xl">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400">
              {t('decision.modal.heading')}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {t('decision.modal.expires', { turn: decision.expiresTurn })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMinimized(true)}
            aria-label={t('decision.minimize')}
            className="text-slate-500 hover:text-slate-300"
          >
            −
          </button>
        </div>

        {/* Prompt */}
        <p className="mb-1 text-sm font-semibold text-white">{prompt}</p>
        {detail && <p className="mb-3 text-xs text-slate-400">{detail}</p>}

        {/* Options */}
        <ul className="flex flex-col gap-2">
          {decision.options.map((opt) => {
            const label = optionLabel(opt, locale);
            const cashSign = opt.cashDelta >= 0 ? '+' : '';
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  data-testid={`decision-option-${opt.id}`}
                  onClick={() => handleResolve(opt)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition hover:border-accent ${
                    opt.isDefault
                      ? 'border-slate-600 bg-ops-800/60'
                      : 'border-ops-600 bg-ops-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100">{label}</span>
                    {opt.isDefault && (
                      <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                        {t('decision.default.tag')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      {t('decision.cash.impact')}{' '}
                      <span className={opt.cashDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {cashSign}
                        {formatMoney(opt.cashDelta)}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      {t('decision.brand.impact')}{' '}
                      <BrandArrow delta={opt.brandDelta} />
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

