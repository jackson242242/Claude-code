import type { TransportOffer, TransportSearchQuery } from '@/types';
import { mockTransportOffers } from '@/mocks/offers';
import { postJson, mocksEnabled } from './apiClient';

export const searchTransport = async (
  query: TransportSearchQuery,
): Promise<TransportOffer[]> => {
  if (mocksEnabled()) return mockTransportOffers(query);
  try {
    return await postJson<TransportOffer[]>('/transport/search', query);
  } catch {
    return mockTransportOffers(query);
  }
};
