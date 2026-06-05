import {
  calculateTripCostBreakdown,
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

  it('calculates cost breakdown by item kind', () => {
    const items = [
      item({ kind: 'flight', priceUsd: 250 }),
      item({ kind: 'flight', priceUsd: 180 }),
      item({ kind: 'hotel', priceUsd: 150 }),
      item({ kind: 'hotel', priceUsd: 200 }),
      item({ kind: 'transport', priceUsd: 75.5 }),
      item({ kind: 'match', priceUsd: 0 }),
    ];

    const breakdown = calculateTripCostBreakdown(items);

    expect(breakdown.flight).toBe(430);
    expect(breakdown.hotel).toBe(350);
    expect(breakdown.transport).toBe(75.5);
    expect(breakdown.match).toBe(0);
  });

  it('rounds cost breakdown values to 2 decimal places', () => {
    const items = [
      item({ kind: 'flight', priceUsd: 100.333 }),
      item({ kind: 'hotel', priceUsd: 50.456 }),
    ];

    const breakdown = calculateTripCostBreakdown(items);

    expect(breakdown.flight).toBe(100.33);
    expect(breakdown.hotel).toBe(50.46);
  });

  it('returns zero values for empty item list', () => {
    const breakdown = calculateTripCostBreakdown([]);

    expect(breakdown.flight).toBe(0);
    expect(breakdown.hotel).toBe(0);
    expect(breakdown.transport).toBe(0);
    expect(breakdown.match).toBe(0);
  });
});
