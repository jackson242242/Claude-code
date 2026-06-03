import type { City, Match, MatchFilters, Team, Venue } from '@/types';
import { MOCK_CITIES } from '@/mocks/cities';
import { MOCK_MATCHES } from '@/mocks/matches';
import { MOCK_TEAMS } from '@/mocks/teams';
import { MOCK_VENUES } from '@/mocks/venues';
import { getJson, mocksEnabled } from './apiClient';
import { filterMatches, sortByKickoff } from './matchFilters';

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
    return await getJson<Match[]>(`/matches${toQuery(filters)}`);
  } catch {
    return mockMatches(filters);
  }
};

export const getMatchById = async (id: string): Promise<Match | null> => {
  if (!mocksEnabled()) {
    try {
      return await getJson<Match>(`/matches/${id}`);
    } catch {
      // fall through to the mock layer
    }
  }
  return MOCK_MATCHES.find((match) => match.id === id) ?? null;
};

export const getCities = async (): Promise<City[]> => {
  if (!mocksEnabled()) {
    try {
      return await getJson<City[]>('/cities');
    } catch {
      // fall through to the mock layer
    }
  }
  return MOCK_CITIES;
};

export const getCityById = async (id: string): Promise<City | null> => {
  if (!mocksEnabled()) {
    try {
      return await getJson<City>(`/cities/${id}`);
    } catch {
      // fall through to the mock layer
    }
  }
  return MOCK_CITIES.find((city) => city.id === id) ?? null;
};

export const getTeams = async (): Promise<Team[]> => {
  if (!mocksEnabled()) {
    try {
      return await getJson<Team[]>('/teams');
    } catch {
      // fall through to the mock layer
    }
  }
  return MOCK_TEAMS;
};

/** Venues are static reference data, resolved locally on both server and client. */
export const getVenueById = (id: string): Venue | null =>
  MOCK_VENUES.find((venue) => venue.id === id) ?? null;

export const getVenues = (): Venue[] => MOCK_VENUES;
