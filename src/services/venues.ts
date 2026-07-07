/**
 * Venue lookups — static reference data, resolved locally on both server and
 * client. Kept in its own module (importing only the venues mock) so client
 * components like MatchCard can resolve venue names without pulling the
 * match/city/team mock datasets into the browser bundle.
 */
import type { Venue } from '@/types';
import { MOCK_VENUES } from '@/mocks/venues';

const VENUES_BY_ID = new Map(MOCK_VENUES.map((venue) => [venue.id, venue]));

export const getVenueById = (id: string): Venue | null =>
  VENUES_BY_ID.get(id) ?? null;

export const getVenues = (): Venue[] => MOCK_VENUES;
