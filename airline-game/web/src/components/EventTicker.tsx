'use client';

import { useState } from 'react';
import { CITY_BY_ID } from '@/lib/data';
import type { ActiveEvent, EventEffect } from '@/types';

// ---- effect translation helpers ----------------------------------------

const TARGET_LABELS: Record<EventEffect['target'], string> = {
  demand: '需求',
  fuelCost: '燃油',
  slotFee: '机场费',
  serviceCost: '服务成本',
};

const formatMult = (mult: number): string => {
  // Display as ×N.N (e.g. ×1.3, ×0.8)
  return `×${mult.toFixed(1)}`;
};

const scopeLabel = (scope: ActiveEvent['scope']): string => {
  if (scope.kind === 'global') return '全球';
  if (scope.kind === 'city') {
    return scope.ids
      .map((id) => CITY_BY_ID.get(id)?.nameZh ?? id)
      .join('／');
  }
  // route: two city ids
  const names = scope.ids.map((id) => CITY_BY_ID.get(id)?.nameZh ?? id);
  return names.join('↔');
};

const effectsSummary = (effects: EventEffect[], scope: ActiveEvent['scope']): string => {
  const parts = effects.map((e) => `${TARGET_LABELS[e.target]} ${formatMult(e.mult)}`);
  return `${parts.join(' · ')} · 影响 ${scopeLabel(scope)}`;
};

// ---- severity dot ------------------------------------------------------

type SeverityDotProps = { severity: ActiveEvent['severity'] };

const SeverityDot = ({ severity }: SeverityDotProps) => (
  <span
    aria-label={severity === 'major' ? '严重' : '轻微'}
    data-testid={`severity-dot-${severity}`}
    className={`inline-block h-2 w-2 flex-none rounded-full ${
      severity === 'major' ? 'bg-red-400' : 'bg-amber-400'
    }`}
  />
);

// ---- popover -----------------------------------------------------------

type PopoverProps = {
  event: ActiveEvent;
  onClose: () => void;
};

const Popover = ({ event, onClose }: PopoverProps) => (
  <div
    data-testid="event-popover"
    role="dialog"
    aria-modal="true"
    aria-label={event.headline}
    className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-ops-700 bg-ops-900/98 p-3 shadow-xl backdrop-blur"
  >
    <div className="mb-1.5 flex items-start gap-2">
      <SeverityDot severity={event.severity} />
      <p className="flex-1 text-xs font-semibold text-white">{event.headline}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭"
        className="text-slate-500 hover:text-white"
      >
        ✕
      </button>
    </div>

    {event.detail && (
      <p className="mb-1.5 text-[11px] text-slate-400">{event.detail}</p>
    )}

    <p
      data-testid="event-effects-summary"
      className="mb-1.5 rounded bg-ops-800 px-2 py-1 text-[11px] font-medium text-amber-300"
    >
      {effectsSummary(event.effects, event.scope)}
    </p>

    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-500">
        ⏳ 剩 {event.remainingTurns} 季
      </span>
      {event.sourceUrl && (
        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-glow underline decoration-dotted underline-offset-2 hover:text-white"
        >
          原文链接
        </a>
      )}
    </div>
  </div>
);

// ---- pill --------------------------------------------------------------

type PillProps = {
  event: ActiveEvent;
  isOpen: boolean;
  onToggle: () => void;
};

const Pill = ({ event, isOpen, onToggle }: PillProps) => (
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
      <span className="max-w-[160px] truncate">{event.headline}</span>
      <span
        data-testid="remaining-turns"
        className="flex-none text-slate-500"
      >
        ⏳ 剩 {event.remainingTurns} 季
      </span>
    </button>

    {isOpen && <Popover event={event} onClose={onToggle} />}
  </div>
);

// ---- ticker (public) ---------------------------------------------------

type EventTickerProps = {
  events: ActiveEvent[];
};

export const EventTicker = ({ events }: EventTickerProps) => {
  const [openId, setOpenId] = useState<string | null>(null);

  if (events.length === 0) return null;

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div
      data-testid="event-ticker"
      role="region"
      aria-label="当前事件"
      className="flex items-center gap-2 overflow-x-auto border-b border-ops-700 bg-ops-900/80 px-3 py-1.5 scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      <span className="flex-none text-[10px] font-semibold uppercase tracking-widest text-amber-500">
        事件
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
