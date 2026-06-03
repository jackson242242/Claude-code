import type { FlightOffer, FlightSearchQuery } from '@/types';
import { mockFlightOffers } from '@/mocks/offers';
import { postJson, mocksEnabled } from './apiClient';

export const searchFlights = async (
  query: FlightSearchQuery,
): Promise<FlightOffer[]> => {
  if (mocksEnabled()) return mockFlightOffers(query);
  try {
    return await postJson<FlightOffer[]>('/flights/search', query);
  } catch {
    return mockFlightOffers(query);
  }
};
