import { render, screen } from '@testing-library/react';
import { TripCostSummary } from '@/components/TripCostSummary';
import type { TripItem } from '@/types';

const baseItem = (overrides: Partial<TripItem>): TripItem => ({
  id: 'i',
  tripId: 't',
  kind: 'flight',
  matchId: null,
  cityId: null,
  title: 'Sample Item',
  subtitle: null,
  priceUsd: 0,
  startsAt: null,
  sortOrder: 0,
  payload: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('TripCostSummary', () => {
  it('renders cost breakdown with multiple item kinds', () => {
    const items = [
      baseItem({ id: 'f1', kind: 'flight', priceUsd: 250 }),
      baseItem({ id: 'f2', kind: 'flight', priceUsd: 180 }),
      baseItem({ id: 'h1', kind: 'hotel', priceUsd: 300 }),
      baseItem({ id: 't1', kind: 'transport', priceUsd: 75 }),
    ];

    render(<TripCostSummary items={items} totalUsd={805} />);

    expect(screen.getByText('Cost breakdown')).toBeInTheDocument();
    expect(screen.getByText('Flight')).toBeInTheDocument();
    expect(screen.getByText('$430')).toBeInTheDocument();
    expect(screen.getByText('Hotel')).toBeInTheDocument();
    expect(screen.getByText('$300')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('$75')).toBeInTheDocument();
    expect(screen.getByText('Trip total')).toBeInTheDocument();
    expect(screen.getByText('$805')).toBeInTheDocument();
  });

  it('omits categories with zero cost', () => {
    const items = [baseItem({ kind: 'flight', priceUsd: 200 })];

    render(<TripCostSummary items={items} totalUsd={200} />);

    expect(screen.getByText('Flight')).toBeInTheDocument();
    expect(screen.getAllByText('$200')).toHaveLength(2); // once in breakdown, once in total
    expect(screen.queryByText('Hotel')).not.toBeInTheDocument();
    expect(screen.queryByText('Transport')).not.toBeInTheDocument();
  });

  it('renders nothing when items list is empty', () => {
    const { container } = render(<TripCostSummary items={[]} totalUsd={0} />);

    expect(screen.queryByText('Cost breakdown')).not.toBeInTheDocument();
    expect(container.querySelector('.trip-cost-summary')?.children.length).toBe(0);
  });

  it('displays all item kinds when all have costs', () => {
    const items = [
      baseItem({ kind: 'match', priceUsd: 100 }),
      baseItem({ kind: 'flight', priceUsd: 250 }),
      baseItem({ kind: 'hotel', priceUsd: 300 }),
      baseItem({ kind: 'transport', priceUsd: 50 }),
    ];

    render(<TripCostSummary items={items} totalUsd={700} />);

    expect(screen.getByText('Match')).toBeInTheDocument();
    expect(screen.getByText('Flight')).toBeInTheDocument();
    expect(screen.getByText('Hotel')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('$700')).toBeInTheDocument();
  });
});
