import { render, screen } from '@testing-library/react';
import { SlotBadge } from '@/components/SlotBadge';
import type { CitySlotInfo } from '@/types';

const info: CitySlotInfo = { capacity: 12, taken: 7, playerHeld: 2, playerUsed: 1 };

describe('SlotBadge', () => {
  it('renders 持有/占用/池 chips from the slot snapshot', () => {
    render(<SlotBadge cityId="nyc" info={info} />);

    const badge = screen.getByTestId('slot-badge-nyc');
    expect(badge).toHaveTextContent('持有 2');
    expect(badge).toHaveTextContent('占用 1');
    expect(badge).toHaveTextContent('池 7/12');
  });

  it('renders nothing when the city has no slot snapshot', () => {
    render(<SlotBadge cityId="nyc" info={undefined} />);

    expect(screen.queryByTestId('slot-badge-nyc')).not.toBeInTheDocument();
  });
});
