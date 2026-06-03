import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TripItemRow } from '@/components/TripItemRow';
import type { TripItem } from '@/types';

const baseItem: TripItem = {
  id: 'i1',
  tripId: 't1',
  kind: 'hotel',
  matchId: null,
  cityId: 'miami',
  title: 'Grand Plaza',
  subtitle: '3 nights',
  priceUsd: 540,
  startsAt: null,
  sortOrder: 0,
  payload: {},
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('TripItemRow', () => {
  it('renders the kind badge, title and price', () => {
    render(
      <ul>
        <TripItemRow item={baseItem} />
      </ul>,
    );
    expect(screen.getByText('Hotel')).toBeInTheDocument();
    expect(screen.getByText('Grand Plaza')).toBeInTheDocument();
    expect(screen.getByText('$540')).toBeInTheDocument();
  });

  it('calls onRemove with the item id when removed', async () => {
    const onRemove = jest.fn();
    const user = userEvent.setup();
    render(
      <ul>
        <TripItemRow item={baseItem} onRemove={onRemove} />
      </ul>,
    );
    await user.click(screen.getByRole('button', { name: /Remove Grand Plaza/ }));
    expect(onRemove).toHaveBeenCalledWith('i1');
  });
});
