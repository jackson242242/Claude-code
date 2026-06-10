import { render, screen } from '@testing-library/react';
import { TransportCard } from '@/components/TransportCard';
import type { TransportOffer } from '@/types';

const baseOffer: Omit<TransportOffer, 'mode'> = {
  id: 't1',
  type: 'transport',
  provider: 'MockMove',
  origin: 'Toronto',
  destination: 'Mexico City',
  departUtc: '2026-06-20T10:00:00.000Z',
  arriveUtc: '2026-06-20T12:00:00.000Z',
  durationMinutes: 120,
  priceUsd: 60,
};

describe('TransportCard', () => {
  it('gives rideshare offers Uber, Lyft and Maps deep links', () => {
    render(<TransportCard offer={{ ...baseOffer, mode: 'rideshare' }} />);

    const uber = screen.getByRole('link', { name: /Open Uber to Mexico City/i });
    expect(uber).toHaveAttribute('target', '_blank');
    expect(uber.getAttribute('href')).toContain('m.uber.com');
    expect(uber.getAttribute('href')).toContain('dropoff%5Blatitude%5D=19.303');

    const lyft = screen.getByRole('link', { name: /Open Lyft to Mexico City/i });
    expect(lyft.getAttribute('href')).toContain('ride.lyft.com');

    const maps = screen.getByRole('link', { name: /Google Maps/i });
    expect(maps.getAttribute('href')).toContain('travelmode=driving');
  });

  it('gives transit modes a Google Maps directions link with transit mode', () => {
    render(<TransportCard offer={{ ...baseOffer, mode: 'train' }} />);

    expect(screen.queryByRole('link', { name: /Uber/i })).not.toBeInTheDocument();
    const maps = screen.getByRole('link', {
      name: /Directions from Toronto to Mexico City in Google Maps/i,
    });
    expect(maps.getAttribute('href')).toContain('travelmode=transit');
    expect(maps.getAttribute('href')).toContain('destination=Mexico+City%2C+Mexico');
  });

  it('hides Uber/Lyft when the rideshare destination is not a host city', () => {
    render(
      <TransportCard
        offer={{ ...baseOffer, mode: 'rideshare', destination: 'Springfield' }}
      />,
    );
    expect(screen.queryByRole('link', { name: /Uber/i })).not.toBeInTheDocument();
    // Maps directions still render (free-text geocoding is fine for maps)
    expect(screen.getByRole('link', { name: /Google Maps/i })).toBeInTheDocument();
  });
});
