import { MOCK_MATCHES } from '@/mocks/matches';
import { MOCK_CITIES } from '@/mocks/cities';
import { MOCK_VENUES } from '@/mocks/venues';
import { MOCK_TEAMS } from '@/mocks/teams';

describe('2026 World Cup seed data', () => {
  it('has the full 104-match schedule', () => {
    expect(MOCK_MATCHES).toHaveLength(104);
  });

  it('splits into 72 group-stage and 32 knockout matches', () => {
    const group = MOCK_MATCHES.filter((m) => m.stage === 'Group Stage');
    const knockout = MOCK_MATCHES.filter((m) => m.group === null);
    expect(group).toHaveLength(72);
    expect(knockout).toHaveLength(32);
  });

  it('opens in Mexico City and ends with the Final at MetLife', () => {
    const opener = MOCK_MATCHES.find((m) => m.matchNumber === 1);
    expect(opener?.venueId).toBe('mexico-city');

    const final = MOCK_MATCHES.find((m) => m.stage === 'Final');
    expect(final?.venueId).toBe('new-york');
    expect(final?.matchNumber).toBe(104);
  });

  it('only references known venues', () => {
    const venueIds = new Set(MOCK_VENUES.map((v) => v.id));
    expect(MOCK_MATCHES.every((m) => venueIds.has(m.venueId))).toBe(true);
  });

  it('has 16 host cities and venues and 48 teams across 12 groups', () => {
    expect(MOCK_CITIES).toHaveLength(16);
    expect(MOCK_VENUES).toHaveLength(16);
    expect(MOCK_TEAMS).toHaveLength(48);
    expect(new Set(MOCK_TEAMS.map((t) => t.group)).size).toBe(12);
  });
});
