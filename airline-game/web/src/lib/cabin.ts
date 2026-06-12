// M2.3 舱位与服务 — CONTRACT §3 cabin/service math, mirrored from
// api/app/engine/balance.py. cabinMix is *floor-space* percent: one business
// seat takes 2.5 economy-seat spaces, one first seat takes 5; sellable seats
// floor per class.
import type { CabinMix, ClassStats, Route } from '@/types';

export const BIZ_SPACE = 2.5;
export const FIRST_SPACE = 5;

export type CabinSeats = { economy: number; business: number; first: number };

export type CabinClassKey = keyof CabinSeats;

// Display metadata in contract order.
export const CABIN_CLASSES: readonly { key: CabinClassKey; label: string }[] = [
  { key: 'economy', label: '经济' },
  { key: 'business', label: '商务' },
  { key: 'first', label: '头等' },
];

// Per-aircraft sellable seats — CONTRACT: econ = seats×mixE/100,
// biz = seats×mixB/100/2.5, first = seats×mixF/100/5, each floored.
export const cabinSeats = (seats: number, mix: CabinMix): CabinSeats => ({
  economy: Math.floor((seats * mix.economy) / 100),
  business: Math.floor((seats * mix.business) / 100 / BIZ_SPACE),
  first: Math.floor((seats * mix.first) / 100 / FIRST_SPACE),
});

// Alias used in tests and spec — identical to cabinSeats.
export const seatBreakdown = cabinSeats;

// Sum sellable seats over a set of aircraft seat counts (floors apply per aircraft).
export const totalCabinSeats = (seatCounts: number[], mix: CabinMix): CabinSeats =>
  seatCounts.reduce<CabinSeats>(
    (acc, seats) => {
      const perAircraft = cabinSeats(seats, mix);
      return {
        economy: acc.economy + perAircraft.economy,
        business: acc.business + perAircraft.business,
        first: acc.first + perAircraft.first,
      };
    },
    { economy: 0, business: 0, first: 0 },
  );

// serviceTier segmented-control metadata — SERVICE_WEIGHT / SERVICE_COST_PER_PAX.
export const SERVICE_TIERS: readonly {
  tier: Route['serviceTier'];
  label: string;
  hint: string;
}[] = [
  { tier: 1, label: '经济型', hint: '竞争权重 ×0.85 · 服务成本 $12/客' },
  { tier: 2, label: '标准', hint: '竞争权重 ×1.00 · 服务成本 $25/客' },
  { tier: 3, label: '豪华', hint: '竞争权重 ×1.15 · 服务成本 $45/客' },
];

// All-economy routes keep the M2.2 compact display; premium classes only show
// once business/first capacity exists.
export const hasPremiumClasses = (classes: {
  business: ClassStats;
  first: ClassStats;
}): boolean => classes.business.capacity > 0 || classes.first.capacity > 0;

// Validate a CabinMix: all values must be non-negative integers summing to 100.
export const validateMix = (mix: CabinMix): boolean => {
  const vals = [mix.economy, mix.business, mix.first];
  return (
    vals.every((v) => Number.isInteger(v) && v >= 0) &&
    vals.reduce((a, b) => a + b, 0) === 100
  );
};
