import { render, screen } from '@testing-library/react';
import { HeroLiveStrip } from '@/components/HeroLiveStrip';
import type { Match } from '@/types';

const match: Match = {
  id: 'M1',
  matchNumber: 1,
  stage: 'Group Stage',
  group: 'A',
  homeTeam: 'Mexico',
  awayTeam: 'Argentina',
  venueId: 'mexico-city',
  kickoffUtc: '2026-06-11T19:00:00.000Z',
  kickoffLocal: '2026-06-11T13:00:00',
  status: 'scheduled',
};

describe('HeroLiveStrip', () => {
  it('shows the LIVE NOW badge and links each match to its detail page', () => {
    render(<HeroLiveStrip matches={[match]} />);
    expect(screen.getByText('LIVE NOW')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Mexico.*Argentina/ });
    expect(link).toHaveAttribute('href', '/matches/M1');
    expect(link).toHaveTextContent('13:00');
    expect(link).toHaveTextContent('Estadio Azteca');
  });

  it('always offers the full schedule link', () => {
    render(<HeroLiveStrip matches={[match]} />);
    expect(screen.getByRole('link', { name: /full schedule/i })).toHaveAttribute(
      'href',
      '/schedule',
    );
  });

  it('shows a rest-day note when there are no matches today', () => {
    render(<HeroLiveStrip matches={[]} />);
    expect(screen.getByText(/rest day/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
