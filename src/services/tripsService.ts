import type {
  AddTripItemInput,
  Trip,
  TripSuggestions,
  TripSummary,
  User,
} from '@/types';
import { authedFetch } from './authedClient';

/**
 * Trip data is user-specific and mutable, so it is always served by the
 * backend (which itself runs with an in-memory store when no database is set).
 */

export const getMe = (): Promise<User> => authedFetch<User>('/me');

export const listTrips = (): Promise<TripSummary[]> =>
  authedFetch<TripSummary[]>('/trips');

export const createTrip = (name: string): Promise<Trip> =>
  authedFetch<Trip>('/trips', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const getTrip = (id: string): Promise<Trip> =>
  authedFetch<Trip>(`/trips/${id}`);

export const renameTrip = (id: string, name: string): Promise<Trip> =>
  authedFetch<Trip>(`/trips/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });

export const deleteTrip = (id: string): Promise<{ ok: boolean }> =>
  authedFetch<{ ok: boolean }>(`/trips/${id}`, { method: 'DELETE' });

export const addTripItem = (
  id: string,
  item: AddTripItemInput,
): Promise<Trip> =>
  authedFetch<Trip>(`/trips/${id}/items`, {
    method: 'POST',
    body: JSON.stringify(item),
  });

export const removeTripItem = (id: string, itemId: string): Promise<Trip> =>
  authedFetch<Trip>(`/trips/${id}/items/${itemId}`, { method: 'DELETE' });

export const getTripSuggestions = (id: string): Promise<TripSuggestions> =>
  authedFetch<TripSuggestions>(`/trips/${id}/suggestions`);

export const getSharedTrip = (token: string): Promise<Trip> =>
  authedFetch<Trip>(`/shared/${token}`);
