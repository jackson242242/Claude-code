import { filterMatches, sortByKickoff } from '@/services/matchFilters';
import { MOCK_MATCHES } from '@/mocks/matches';

describe('filterMatches', () => {
  it('filters by group', () => {
    const result = filterMatches(MOCK_MATCHES, { group: 'A' });
    expect(result).toHaveLength(6);
    expect(result.every((m) => m.group === 'A')).toBe(true);
  });

  it('filters by stage', () => {
    expect(filterMatches(MOCK_MATCHES, { stage: 'Final' })).toHaveLength(1);
  });

  it('filters by host city via venue id', () => {
    const result = filterMatches(MOCK_MATCHES, { cityId: 'mexico-city' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((m) => m.venueId === 'mexico-city')).toBe(true);
  });

  it('filters by team name, case-insensitively', () => {
    const result = filterMatches(MOCK_MATCHES, { team: 'mexico' });
    expect(result).toHaveLength(3);
    expect(
      result.every(
        (m) => m.homeTeam.includes('Mexico') || m.awayTeam.includes('Mexico'),
      ),
    ).toBe(true);
  });
});

describe('sortByKickoff', () => {
  it('returns matches in ascending kickoff order', () => {
    const sorted = sortByKickoff(MOCK_MATCHES);
    for (let i = 1; i < sorted.length; i += 1) {
      expect(sorted[i].kickoffUtc >= sorted[i - 1].kickoffUtc).toBe(true);
    }
  });
});
