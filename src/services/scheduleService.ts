import type { City, Match, MatchFilters, NearbyCity, Team } from '@/types';
import { MOCK_CITIES } from '@/mocks/cities';
import { MOCK_MATCHES } from '@/mocks/matches';
import { MOCK_TEAMS } from '@/mocks/teams';
import { nearestCities } from '@/lib/geo';
import { getJson, mocksEnabled } from './apiClient';
import { filterMatches, sortByKickoff } from './matchFilters';

// Venue lookups live in ./venues (venues-only import) so client components can
// resolve venue names without bundling the match/city/team mock datasets.
export { getVenueById, getVenues } from './venues';

/** Matches carry live status during the tournament — cache briefly. */
const MATCH_REVALIDATE_SECONDS = 300;
/** Host cities and teams are fixed reference data — cache for an hour. */
const REFERENCE_REVALIDATE_SECONDS = 3600;

const toQuery = (filters: MatchFilters): string => {
  const params = new URLSearchParams();
  if (filters.cityId) params.set('city', filters.cityId);
  if (filters.team) params.set('team', filters.team);
  if (filters.group) params.set('group', filters.group);
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.date) params.set('date', filters.date);
  const query = params.toString();
  return query ? `?${query}` : '';
};

const mockMatches = (filters: MatchFilters): Match[] =>
  sortByKickoff(filterMatches(MOCK_MATCHES, filters));

export const getMatches = async (
  filters: MatchFilters = {},
): Promise<Match[]> => {
  if (mocksEnabled()) return mockMatches(filters);
  try {
    return await getJson<Match[]>(
      `/matches${toQuery(filters)}`,
      MATCH_REVALIDATE_SECONDS,
    );
  } catch {
    return mockMatches(filters);
  }
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  if (!mocksEnabled()) {
    try {
      return await getJson<Match>(`/matches/${id}`, MATCH_REVALIDATE_SECONDS);
    } catch {
      // fall through to the mock layer
    }
  }
  return MOCK_MATCHES.find((match) => match.id === id) ?? null;
};

export const getCities = async (): Promise<City[]> => {
  if (!mocksEnabled()) {
    try {
      return await getJson<City[]>('/cities', REFERENCE_REVALIDATE_SECONDS);
    } catch {
      // fall through to the mock layer
    }
  }
  return MOCK_CITIES;
};

export const getCityById = async (id: string): Promise<City | null> => {
  if (!mocksEnabled()) {
    try {
      return await getJson<City>(
        `/cities/${id}`,
        REFERENCE_REVALIDATE_SECONDS,
      );
    } catch {
      // fall through to the mock layer
    }
  }
  return MOCK_CITIES.find((city) => city.id === id) ?? null;
};

export const getTeams = async (): Promise<Team[]> => {
  if (!mocksEnabled()) {
    try {
      return await getJson<Team[]>('/teams', REFERENCE_REVALIDATE_SECONDS);
    } catch {
      // fall through to the mock layer
    }
  }
  return MOCK_TEAMS;
};

export const getNearbyCities = async (
  id: string,
  limit = 3,
): Promise<NearbyCity[]> => {
  if (!mocksEnabled()) {
    try {
      return await getJson<NearbyCity[]>(
        `/cities/${id}/nearby?limit=${limit}`,
        REFERENCE_REVALIDATE_SECONDS,
      );
    } catch {
      // fall through to the local geo computation
    }
  }
  return nearestCities(MOCK_CITIES, id, limit);
};

