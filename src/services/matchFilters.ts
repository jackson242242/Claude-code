import type { Match, MatchFilters } from '@/types';

/**
 * Pure, dependency-free match filtering. Kept separate from the data-access
 * service so client components can reuse it without bundling the mock data.
 * Note: in this dataset a venue id is identical to its host city id, so the
 * `cityId` filter matches directly against `venueId`.
 */
export const filterMatches = (
  matches: Match[],
  filters: MatchFilters = {},
): Match[] =>
  matches.filter((match) => {
    if (filters.cityId && match.venueId !== filters.cityId) return false;
    if (filters.group && match.group !== filters.group) return false;
    if (filters.stage && match.stage !== filters.stage) return false;
    if (filters.date && !match.kickoffLocal.startsWith(filters.date)) {
      return false;
    }
    if (filters.team) {
      const needle = filters.team.toLowerCase();
      const matchesTeam =
        match.homeTeam.toLowerCase().includes(needle) ||
        match.awayTeam.toLowerCase().includes(needle);
      if (!matchesTeam) return false;
    }
    return true;
  });

export const sortByKickoff = (matches: Match[]): Match[] =>
  [...matches].sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc));
