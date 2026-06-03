import {
  getCities,
  getMatchById,
  getMatches,
  getTeams,
} from '@/services/scheduleService';

// Force the offline mock path so the service needs no backend/DB.
beforeEach(() => {
  process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
});

describe('scheduleService (mock mode)', () => {
  it('returns all 104 matches sorted by kickoff', async () => {
    const matches = await getMatches();
    expect(matches).toHaveLength(104);
    for (let i = 1; i < matches.length; i += 1) {
      expect(matches[i].kickoffUtc >= matches[i - 1].kickoffUtc).toBe(true);
    }
  });

  it('applies filters through the service', async () => {
    expect(await getMatches({ group: 'A' })).toHaveLength(6);
  });

  it('resolves a match by id', async () => {
    const match = await getMatchById('M1');
    expect(match).not.toBeNull();
    expect(match?.matchNumber).toBe(1);
  });

  it('exposes 16 cities and 48 teams', async () => {
    expect(await getCities()).toHaveLength(16);
    expect(await getTeams()).toHaveLength(48);
  });
});
