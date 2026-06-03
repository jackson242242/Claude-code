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
