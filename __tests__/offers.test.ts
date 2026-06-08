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
    // Every offer must carry a booking deep link, so "Book now" always renders
    // even on the offline/API-fallback path (regression guard).
    expect(first.every((offer) => offer.deepLink?.includes('kayak.com'))).toBe(
      true,
    );
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
    expect(
      offers.every((offer) => offer.deepLink?.includes('booking.com')),
    ).toBe(true);
  });

  it('geo-anchors the hotel booking link to the searched city', () => {
    const offers = mockHotelOffers({
      cityId: 'mexico-city',
      checkIn: '2026-06-20',
      checkOut: '2026-06-23',
      guests: 2,
    });
    // The Booking.com destination (ss) must carry the city, not a bare hotel
    // name — otherwise results resolve to the wrong country.
    for (const offer of offers) {
      const ss = new URL(offer.deepLink ?? '').searchParams.get('ss');
      expect(ss).toContain('Mexico City');
    }
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
