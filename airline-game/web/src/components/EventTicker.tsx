'use client';

import { useState } from 'react';
import { CITY_BY_ID } from '@/lib/data';
import { useT } from '@/i18n';
import { localizedHeadline, localizedDetail } from '@/i18n/localizedEvent';
import type { ActiveEvent, EventEffect } from '@/types';

// ---- effect translation helpers ----------------------------------------

const formatMult = (mult: number): string => `×${mult.toFixed(1)}`;

// ---- severity dot ------------------------------------------------------

type SeverityDotProps = { severity: ActiveEvent['severity'] };

const SeverityDot = ({ severity }: SeverityDotProps) => {
  const { t } = useT();
  return (
    <span
      aria-label={severity === 'major' ? t('ticker.severity.major') : t('ticker.severity.minor')}
      data-testid={`severity-dot-${severity}`}
      className={`inline-block h-2 w-2 flex-none rounded-full ${
        severity === 'major' ? 'bg-red-400' : 'bg-amber-400'
      }`}
    />
  );
};

// ---- popover -----------------------------------------------------------

type PopoverProps = {
  event: ActiveEvent;
  onClose: () => void;
};

const Popover = ({ event, onClose }: PopoverProps) => {
  const { t, locale } = useT();

  const targetLabelKey = {
    demand: 'ticker.effect.demand',
    fuelCost: 'ticker.effect.fuelCost',
    slotFee: 'ticker.effect.slotFee',
    serviceCost: 'ticker.effect.serviceCost',
  } as const;

  const scopeLabel = (scope: ActiveEvent['scope']): string => {
    if (scope.kind === 'global') return t('ticker.scope.global');
    const names = scope.ids.map((id) => {
      const city = CITY_BY_ID.get(id);
      if (!city) return id;
      return locale === 'zh' ? city.nameZh : city.name;
    });
    return scope.kind === 'city' ? names.join('／') : names.join('↔');
  };

  const effectsSummary = (effects: EventEffect[], scope: ActiveEvent['scope']): string => {
    const parts = effects.map((e) => `${t(targetLabelKey[e.target])} ${formatMult(e.mult)}`);
    return `${parts.join(' · ')} · ${t('ticker.effects.suffix', { scope: scopeLabel(scope) })}`;
  };

  const headline = localizedHeadline(event, locale);
  const detail = localizedDetail(event, locale);

  return (
    <div
      data-testid="event-popover"
      role="dialog"
      aria-modal="true"
      aria-label={headline}
      className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-ops-700 bg-ops-900/98 p-3 shadow-xl backdrop-blur"
    >
      <div className="mb-1.5 flex items-start gap-2">
        <SeverityDot severity={event.severity} />
        <p className="flex-1 text-xs font-semibold text-white">{headline}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('ticker.aria.close')}
          className="text-slate-500 hover:text-white"
        >
          ✕
        </button>
      </div>

      {detail && (
        <p className="mb-1.5 text-[11px] text-slate-400">{detail}</p>
      )}

      <p
        data-testid="event-effects-summary"
        className="mb-1.5 rounded bg-ops-800 px-2 py-1 text-[11px] font-medium text-amber-300"
      >
        {effectsSummary(event.effects, event.scope)}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          {t('ticker.remaining', { n: event.remainingTurns })}
        </span>
        {event.sourceUrl && (
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-glow underline decoration-dotted underline-offset-2 hover:text-white"
          >
            {t('ticker.sourceLink')}
          </a>
        )}
      </div>
    </div>
  );
};

// ---- pill --------------------------------------------------------------

type PillProps = {
  event: ActiveEvent;
  isOpen: boolean;
  onToggle: () => void;
};

const Pill = ({ event, isOpen, onToggle }: PillProps) => {
  const { t, locale } = useT();
  const headline = localizedHeadline(event, locale);

  return (
    <div className="relative flex-none">
      <button
        type="button"
        data-testid={`event-pill-${event.id}`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
          isOpen
            ? 'border-amber-600 bg-amber-900/40 text-amber-200'
            : 'border-ops-700 bg-ops-850/80 text-slate-300 hover:border-amber-700 hover:text-amber-200'
        }`}
      >
        <SeverityDot severity={event.severity} />
        <span className="max-w-[160px] truncate">{headline}</span>
        <span
          data-testid="remaining-turns"
          className="flex-none text-slate-500"
        >
          {t('ticker.remaining', { n: event.remainingTurns })}
        </span>
      </button>

      {isOpen && <Popover event={event} onClose={onToggle} />}
    </div>
  );
};

// ---- ticker (public) ---------------------------------------------------

type EventTickerProps = {
  events: ActiveEvent[];
};

export const EventTicker = ({ events }: EventTickerProps) => {
  const { t } = useT();
  const [openId, setOpenId] = useState<string | null>(null);

  if (events.length === 0) return null;

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div
      data-testid="event-ticker"
      role="region"
      aria-label={t('ticker.aria.region')}
      className="flex items-center gap-2 overflow-x-auto border-b border-ops-700 bg-ops-900/80 px-3 py-1.5 scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      <span className="flex-none text-[10px] font-semibold uppercase tracking-widest text-amber-500">
        {t('ticker.label')}
      </span>
      {events.map((event) => (
        <Pill
          key={event.id}
          event={event}
          isOpen={openId === event.id}
          onToggle={() => toggle(event.id)}
        />
      ))}
    </div>
  );
};
