import type { GroupId, Match, MatchStage } from '@/types';
import { MOCK_TEAMS } from './teams';

/**
 * Deterministically generates the full 104-match 2026 World Cup schedule:
 *   72 group-stage matches (12 groups × 6) + 32 knockout matches.
 *
 * Venues, kickoff dates and knockout pairings are representative for this
 * foundation build (the tournament window of 11 Jun – 19 Jul 2026 is honoured,
 * the opener is in Mexico City and the final at MetLife). The same algorithm is
 * mirrored in the FastAPI seed module so the API and the mock layer agree.
 */
const VENUE_ORDER: string[] = [
  'mexico-city',
  'atlanta',
  'boston',
  'dallas',
  'houston',
  'kansas-city',
  'los-angeles',
  'miami',
  'new-york',
  'philadelphia',
  'san-francisco',
  'seattle',
  'toronto',
  'vancouver',
  'guadalajara',
  'monterrey',
];

/** Approximate summer UTC offsets (hours) for each host city. */
const CITY_UTC_OFFSET: Record<string, number> = {
  'mexico-city': -6,
  guadalajara: -6,
  monterrey: -6,
  atlanta: -4,
  boston: -4,
  miami: -4,
  'new-york': -4,
  philadelphia: -4,
  toronto: -4,
  dallas: -5,
  houston: -5,
  'kansas-city': -5,
  'los-angeles': -7,
  'san-francisco': -7,
  seattle: -7,
  vancouver: -7,
};

const GROUP_LETTERS: GroupId[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
];

const GROUP_KICKOFF_HOURS = [13, 16, 19, 22];

/** Fixed round-robin ordering for a group of four (indices into the group). */
const ROUND_ROBIN: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [2, 3],
  [0, 2],
  [1, 3],
  [0, 3],
  [1, 2],
];

const pad = (n: number): string => String(n).padStart(2, '0');

interface Kickoff {
  kickoffLocal: string;
  kickoffUtc: string;
}

/** Builds local + UTC kickoff strings from a day offset (from 11 Jun 2026). */
const buildKickoff = (
  dayOffset: number,
  hourLocal: number,
  venueId: string,
): Kickoff => {
  const offset = CITY_UTC_OFFSET[venueId] ?? 0;
  const baseUtc = Date.UTC(2026, 5, 11, 0, 0, 0);
  const localMs = baseUtc + dayOffset * 86_400_000 + hourLocal * 3_600_000;
  const local = new Date(localMs);
  const kickoffLocal =
    `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(
      local.getUTCDate(),
    )}T${pad(local.getUTCHours())}:00:00`;
  const kickoffUtc = new Date(localMs - offset * 3_600_000).toISOString();
  return { kickoffLocal, kickoffUtc };
};

const teamsByGroup = (group: GroupId): string[] =>
  MOCK_TEAMS.filter((team) => team.group === group).map((team) => team.name);

interface Knockout {
  stage: MatchStage;
  home: string;
  away: string;
}

const buildKnockouts = (): Knockout[] => {
  const knockouts: Knockout[] = [];
  for (let i = 0; i < 16; i += 1) {
    knockouts.push({
      stage: 'Round of 32',
      home: `Winner Group ${GROUP_LETTERS[i % 12]}`,
      away: `Runner-up Group ${GROUP_LETTERS[(i + 6) % 12]}`,
    });
  }
  for (let i = 0; i < 8; i += 1) {
    knockouts.push({
      stage: 'Round of 16',
      home: `Winner R32-${2 * i + 1}`,
      away: `Winner R32-${2 * i + 2}`,
    });
  }
  for (let i = 0; i < 4; i += 1) {
    knockouts.push({
      stage: 'Quarter-final',
      home: `Winner R16-${2 * i + 1}`,
      away: `Winner R16-${2 * i + 2}`,
    });
  }
  for (let i = 0; i < 2; i += 1) {
    knockouts.push({
      stage: 'Semi-final',
      home: `Winner QF-${2 * i + 1}`,
      away: `Winner QF-${2 * i + 2}`,
    });
  }
  knockouts.push({ stage: 'Third-place', home: 'Loser SF-1', away: 'Loser SF-2' });
  knockouts.push({ stage: 'Final', home: 'Winner SF-1', away: 'Winner SF-2' });
  return knockouts;
};

const STAGE_DAY_BASE: Record<string, number> = {
  'Round of 32': 17,
  'Round of 16': 23,
  'Quarter-final': 28,
  'Semi-final': 33,
  'Third-place': 37,
  Final: 38,
};

const buildMatches = (): Match[] => {
  const matches: Match[] = [];
  let index = 0;

  // Group stage — 72 matches.
  for (const group of GROUP_LETTERS) {
    const teams = teamsByGroup(group);
    for (const [home, away] of ROUND_ROBIN) {
      const venueId =
        index === 0 ? 'mexico-city' : VENUE_ORDER[index % VENUE_ORDER.length];
      const dayOffset = Math.floor(index / 5);
      const hourLocal = GROUP_KICKOFF_HOURS[index % GROUP_KICKOFF_HOURS.length];
      const { kickoffLocal, kickoffUtc } = buildKickoff(
        dayOffset,
        hourLocal,
        venueId,
      );
      matches.push({
        id: `M${index + 1}`,
        matchNumber: index + 1,
        stage: 'Group Stage',
        group,
        homeTeam: teams[home],
        awayTeam: teams[away],
        venueId,
        kickoffLocal,
        kickoffUtc,
        status: 'scheduled',
      });
      index += 1;
    }
  }

  // Knockout rounds — 32 matches.
  const stageCount: Record<string, number> = {};
  for (const knockout of buildKnockouts()) {
    const seen = stageCount[knockout.stage] ?? 0;
    stageCount[knockout.stage] = seen + 1;

    let venueId = VENUE_ORDER[index % VENUE_ORDER.length];
    if (knockout.stage === 'Final') venueId = 'new-york';
    else if (knockout.stage === 'Third-place') venueId = 'miami';

    const perDay = knockout.stage === 'Round of 32' ? 3 : 2;
    const dayOffset = STAGE_DAY_BASE[knockout.stage] + Math.floor(seen / perDay);
    const hourLocal = knockout.stage === 'Final' ? 15 : [16, 19][seen % 2];
    const { kickoffLocal, kickoffUtc } = buildKickoff(
      dayOffset,
      hourLocal,
      venueId,
    );

    matches.push({
      id: `M${index + 1}`,
      matchNumber: index + 1,
      stage: knockout.stage,
      group: null,
      homeTeam: knockout.home,
      awayTeam: knockout.away,
      venueId,
      kickoffLocal,
      kickoffUtc,
      status: 'scheduled',
    });
    index += 1;
  }

  return matches;
};

export const MOCK_MATCHES: Match[] = buildMatches();
