import {
  sortTripItems,
  tripItemKindLabel,
  tripTotal,
} from '@/services/itinerary';
import type { TripItem } from '@/types';

const item = (overrides: Partial<TripItem>): TripItem => ({
  id: 'i',
  tripId: 't',
  kind: 'match',
  matchId: null,
  cityId: null,
  title: 'x',
  subtitle: null,
  priceUsd: 0,
  startsAt: null,
  sortOrder: 0,
  payload: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('itinerary helpers', () => {
  it('labels each item kind', () => {
    expect(tripItemKindLabel('match')).toBe('Match');
    expect(tripItemKindLabel('hotel')).toBe('Hotel');
    expect(tripItemKindLabel('transport')).toBe('Transport');
  });

  it('sorts by scheduled start, falling back to creation time', () => {
    const a = item({ id: 'a', startsAt: '2026-06-20T13:00:00' });
    const b = item({ id: 'b', startsAt: '2026-06-11T13:00:00' });
    const c = item({ id: 'c', startsAt: null, createdAt: '2026-06-01T00:00:00.000Z' });
    expect(sortTripItems([a, b, c]).map((entry) => entry.id)).toEqual([
      'c',
      'b',
      'a',
    ]);
  });

  it('totals item prices', () => {
    expect(tripTotal([item({ priceUsd: 100 }), item({ priceUsd: 49.5 })])).toBe(
      149.5,
    );
  });
});
