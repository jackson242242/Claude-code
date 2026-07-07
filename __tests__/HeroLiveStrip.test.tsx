import { render, screen } from '@testing-library/react';
import { HeroLiveStrip } from '@/components/HeroLiveStrip';
import type { Match } from '@/types';

const KICKOFF = Date.parse('2026-06-11T19:00:00.000Z');
const HOUR = 3_600_000;

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
    render(<HeroLiveStrip matches={[match]} now={KICKOFF - HOUR} />);
    expect(screen.getByText('LIVE NOW')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Mexico.*Argentina/ });
    expect(link).toHaveAttribute('href', '/matches/M1');
    expect(link).toHaveTextContent('13:00');
    expect(link).toHaveTextContent('Estadio Azteca');
  });

  it('highlights a match in progress instead of its kickoff time', () => {
    render(<HeroLiveStrip matches={[match]} now={KICKOFF + HOUR} />);
    const link = screen.getByRole('link', { name: /Mexico.*Argentina/ });
    expect(link).toHaveTextContent('In progress');
    expect(link).not.toHaveTextContent('13:00');
    expect(link).toHaveClass('hero__live-match--live');
  });

  it('marks a finished match as FT', () => {
    const finished: Match = { ...match, status: 'completed' };
    render(<HeroLiveStrip matches={[finished]} now={KICKOFF + HOUR} />);
    const link = screen.getByRole('link', { name: /Mexico.*Argentina/ });
    expect(link).toHaveTextContent('FT');
    expect(link).toHaveClass('hero__live-match--ft');
  });

  it('always offers the full schedule link', () => {
    render(<HeroLiveStrip matches={[match]} now={KICKOFF - HOUR} />);
    expect(screen.getByRole('link', { name: /full schedule/i })).toHaveAttribute(
      'href',
      '/schedule',
    );
  });

  it('shows a rest-day note when there are no matches today', () => {
    render(<HeroLiveStrip matches={[]} now={KICKOFF} />);
    expect(screen.getByText(/rest day/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('localizes the badge and phase labels', () => {
    render(
      <HeroLiveStrip matches={[match]} now={KICKOFF + HOUR} locale="es" />,
    );
    expect(screen.getByText('EN VIVO')).toBeInTheDocument();
    expect(screen.getByText('En juego')).toBeInTheDocument();
    expect(screen.queryByText('LIVE NOW')).not.toBeInTheDocument();
  });
});
