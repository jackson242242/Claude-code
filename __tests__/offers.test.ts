import {
  mockFlightOffers,
  mockHotelOffers,
  mockTransportOffers,
} from '@/mocks/offers';

describe('mock offer generators', () => {
  it('produces deterministic, priced flight offers', () => {
    const query = {
      origin: 'lhr',
      destination: 'jfk',
      date: '2026-06-20',
      passengers: 2,
    };
    const first = mockFlightOffers(query);
    const second = mockFlightOffers(query);
    expect(first).toHaveLength(5);
    expect(first).toEqual(second);
    expect(first[0].origin).toBe('LHR');
    expect(first.every((offer) => offer.priceUsd > 0)).toBe(true);
  });

  it('computes hotel nights from the date range', () => {
    const offers = mockHotelOffers({
      cityId: 'miami',
      checkIn: '2026-06-20',
      checkOut: '2026-06-23',
      guests: 2,
    });
    expect(offers).toHaveLength(5);
    expect(offers.every((offer) => offer.nights === 3)).toBe(true);
  });

  it('respects a transport mode filter', () => {
    const offers = mockTransportOffers({
      origin: 'Newark',
      destination: 'MetLife Stadium',
      date: '2026-06-20',
      mode: 'train',
    });
    expect(offers).toHaveLength(1);
    expect(offers[0].mode).toBe('train');
  });
});
