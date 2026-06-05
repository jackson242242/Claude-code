import type { TripItem, TripItemKind } from '@/types';

const KIND_LABELS: Record<TripItemKind, string> = {
  match: 'Match',
  flight: 'Flight',
  hotel: 'Hotel',
  transport: 'Transport',
};

export const tripItemKindLabel = (kind: TripItemKind): string =>
  KIND_LABELS[kind];

/** Sorts trip items chronologically (by scheduled start, then creation). */
export const sortTripItems = (items: TripItem[]): TripItem[] =>
  [...items].sort((a, b) => {
    const aKey = a.startsAt ?? a.createdAt;
    const bKey = b.startsAt ?? b.createdAt;
    return aKey.localeCompare(bKey);
  });

export const tripTotal = (items: TripItem[]): number =>
  Math.round(items.reduce((sum, item) => sum + item.priceUsd, 0) * 100) / 100;

/** Calculates cost breakdown by trip item kind. */
export const calculateTripCostBreakdown = (
  items: TripItem[],
): Record<TripItemKind, number> => {
  const breakdown: Record<TripItemKind, number> = {
    match: 0,
    flight: 0,
    hotel: 0,
    transport: 0,
  };

  items.forEach((item) => {
    breakdown[item.kind] += item.priceUsd;
  });

  // Round each category to 2 decimal places
  Object.keys(breakdown).forEach((key) => {
    breakdown[key as TripItemKind] =
      Math.round(breakdown[key as TripItemKind] * 100) / 100;
  });

  return breakdown;
};
