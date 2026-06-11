import type { Match } from '@/types';

export type MatchPhase = 'upcoming' | 'inProgress' | 'fullTime';

/**
 * Wall-clock windows used when the schedule feed is not configured and every
 * match still reports `status: 'scheduled'`. Group games cannot go to extra
 * time; knockout games can run through extra time and penalties.
 */
const GROUP_WINDOW_MS = 2.25 * 3_600_000;
const KNOCKOUT_WINDOW_MS = 3.25 * 3_600_000;

/**
 * Derives what a match is doing right now. Feed-provided status wins
 * (`live`/`completed` are authoritative); otherwise falls back to an honest
 * kickoff-time window, so the strip stays alive even before the boss
 * configures `SCHEDULE_FEED_URL`. Assumes matches kick off on time — a
 * delayed game may read FT slightly early, which we accept until real
 * status data is flowing.
 */
export const getMatchPhase = (match: Match, now: number): MatchPhase => {
  if (match.status === 'completed') return 'fullTime';
  if (match.status === 'live') return 'inProgress';
  const kickoff = Date.parse(match.kickoffUtc);
  if (Number.isNaN(kickoff) || now < kickoff) return 'upcoming';
  const windowMs =
    match.stage === 'Group Stage' ? GROUP_WINDOW_MS : KNOCKOUT_WINDOW_MS;
  return now < kickoff + windowMs ? 'inProgress' : 'fullTime';
};
