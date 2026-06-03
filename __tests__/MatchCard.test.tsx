import { render, screen } from '@testing-library/react';
import { MatchCard } from '@/components/MatchCard';
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

describe('MatchCard', () => {
  it('renders both teams and the resolved venue name', () => {
    render(<MatchCard match={match} />);
    expect(screen.getByText('Mexico')).toBeInTheDocument();
    expect(screen.getByText('Argentina')).toBeInTheDocument();
    expect(screen.getByText('Estadio Azteca')).toBeInTheDocument();
  });

  it('links to the match detail page', () => {
    render(<MatchCard match={match} />);
    expect(screen.getByTestId('match-card')).toHaveAttribute(
      'href',
      '/matches/M1',
    );
  });
});
