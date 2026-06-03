import type { GroupId } from './team';

export type MatchStage =
  | 'Group Stage'
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-final'
  | 'Semi-final'
  | 'Third-place'
  | 'Final';

export type MatchStatus = 'scheduled' | 'live' | 'completed';

export interface Match {
  id: string;
  matchNumber: number;
  stage: MatchStage;
  /** Group letter for group-stage matches; null for knockout matches. */
  group: GroupId | null;
  homeTeam: string;
  awayTeam: string;
  venueId: string;
  /** ISO 8601 instant in UTC, e.g. "2026-06-11T23:00:00.000Z". */
  kickoffUtc: string;
  /** ISO 8601 local wall-clock time at the venue, e.g. "2026-06-11T19:00:00". */
  kickoffLocal: string;
  status: MatchStatus;
}

export interface MatchFilters {
  cityId?: string;
  team?: string;
  group?: GroupId;
  stage?: MatchStage;
  /** Local match date as YYYY-MM-DD. */
  date?: string;
}
