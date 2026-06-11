import { getMatchPhase } from '@/services/matchPhase';
import type { Match } from '@/types';

const KICKOFF = Date.parse('2026-06-11T19:00:00.000Z');

const baseMatch: Match = {
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

const HOUR = 3_600_000;

describe('getMatchPhase', () => {
  it('trusts a feed-provided live status regardless of clock', () => {
    const match: Match = { ...baseMatch, status: 'live' };
    expect(getMatchPhase(match, KICKOFF - HOUR)).toBe('inProgress');
  });

  it('trusts a feed-provided completed status regardless of clock', () => {
    const match: Match = { ...baseMatch, status: 'completed' };
    expect(getMatchPhase(match, KICKOFF + HOUR)).toBe('fullTime');
  });

  it('is upcoming before kickoff when the feed is silent', () => {
    expect(getMatchPhase(baseMatch, KICKOFF - 1)).toBe('upcoming');
  });

  it('is in progress during the group-stage window', () => {
    expect(getMatchPhase(baseMatch, KICKOFF)).toBe('inProgress');
    expect(getMatchPhase(baseMatch, KICKOFF + 2 * HOUR)).toBe('inProgress');
  });

  it('reads full time once the group-stage window closes', () => {
    expect(getMatchPhase(baseMatch, KICKOFF + 2.5 * HOUR)).toBe('fullTime');
  });

  it('gives knockout matches a longer window for extra time and penalties', () => {
    const knockout: Match = { ...baseMatch, stage: 'Final', group: null };
    expect(getMatchPhase(knockout, KICKOFF + 3 * HOUR)).toBe('inProgress');
    expect(getMatchPhase(knockout, KICKOFF + 3.5 * HOUR)).toBe('fullTime');
  });
});
