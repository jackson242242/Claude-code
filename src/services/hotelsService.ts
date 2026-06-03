import type { HotelOffer, HotelSearchQuery } from '@/types';
import { mockHotelOffers } from '@/mocks/offers';
import { postJson, mocksEnabled } from './apiClient';

export const searchHotels = async (
  query: HotelSearchQuery,
): Promise<HotelOffer[]> => {
  if (mocksEnabled()) return mockHotelOffers(query);
  try {
    return await postJson<HotelOffer[]>('/hotels/search', query);
  } catch {
    return mockHotelOffers(query);
  }
};
