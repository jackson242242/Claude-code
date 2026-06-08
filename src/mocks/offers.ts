import type {
  FlightOffer,
  FlightSearchQuery,
  HotelOffer,
  HotelSearchQuery,
  TransportMode,
  TransportOffer,
  TransportSearchQuery,
} from '@/types';
import { MOCK_CITIES } from './cities';

/**
 * Deterministic mock offer generators used by the frontend services as an
 * offline fallback. The backend exposes equivalent mock providers behind the
 * adapter interfaces; both produce the same normalized offer shapes.
 */
const AIRLINES = [
  'Aeromexico',
  'United',
  'Delta',
  'Air Canada',
  'American',
  'JetBlue',
];

const HOTEL_BRANDS = [
  'Grand Plaza',
  'City Center Inn',
  'Harbor Suites',
  'Stadium View Hotel',
  'Sunset Lodge',
  'Metropolitan',
];

const TRANSPORT_MODES: TransportMode[] = [
  'train',
  'bus',
  'rideshare',
  'shuttle',
  'car-rental',
];

/** Stable FNV-1a-based pseudo-random integer in [min, max] from a string seed. */
const seededInt = (seed: string, min: number, max: number): number => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return min + (Math.abs(hash) % (max - min + 1));
};

const diffDays = (from: string, to: string): number => {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000,
  );
};

const leg = (
  date: string,
  startHour: number,
  durationMinutes: number,
): { departUtc: string; arriveUtc: string } => {
  const [y, m, d] = date.split('-').map(Number);
  const departMs = Date.UTC(y, m - 1, d, startHour, 0, 0);
  return {
    departUtc: new Date(departMs).toISOString(),
    arriveUtc: new Date(departMs + durationMinutes * 60_000).toISOString(),
  };
};

export const mockFlightOffers = (query: FlightSearchQuery): FlightOffer[] =>
  Array.from({ length: 5 }, (_, i) => {
    const seed = `${query.origin}-${query.destination}-${query.date}-${i}`;
    const durationMinutes = seededInt(seed, 75, 360);
    const stops = seededInt(`${seed}-stops`, 0, 2);
    const { departUtc, arriveUtc } = leg(
      query.date,
      6 + seededInt(seed, 0, 12),
      durationMinutes,
    );
    return {
      id: `flt-${seed}`,
      type: 'flight',
      provider: 'MockAir',
      airline: AIRLINES[seededInt(seed, 0, AIRLINES.length - 1)],
      origin: query.origin.toUpperCase(),
      destination: query.destination.toUpperCase(),
      departUtc,
      arriveUtc,
      durationMinutes,
      stops,
      priceUsd: seededInt(seed, 120, 900) * Math.max(1, query.passengers),
      deepLink: `https://www.kayak.com/flights/${query.origin.toUpperCase()}-${query.destination.toUpperCase()}/${query.date}/${Math.max(1, query.passengers)}adults`,
    };
  });

export const mockHotelOffers = (query: HotelSearchQuery): HotelOffer[] => {
  const nights = Math.max(1, diffDays(query.checkIn, query.checkOut));
  // Geo-anchor the Booking.com link to the searched city ("City, Country").
  // A bare hotel name resolves globally and lands users in the wrong country.
  const city = MOCK_CITIES.find((entry) => entry.id === query.cityId);
  const destination = city ? `${city.name}, ${city.country}` : query.cityId;
  return Array.from({ length: 5 }, (_, i) => {
    const seed = `${query.cityId}-${query.checkIn}-${i}`;
    const pricePerNightUsd = seededInt(seed, 90, 480);
    return {
      id: `htl-${seed}`,
      type: 'hotel',
      provider: 'MockStay',
      name: HOTEL_BRANDS[i % HOTEL_BRANDS.length],
      cityId: query.cityId,
      rating: seededInt(`${seed}-r`, 3, 5),
      distanceKm: seededInt(`${seed}-d`, 3, 250) / 10,
      pricePerNightUsd,
      nights,
      priceUsd: pricePerNightUsd * nights * Math.max(1, query.guests > 2 ? 2 : 1),
      deepLink: `https://www.booking.com/searchresults.html?${new URLSearchParams(
        {
          ss: destination,
          checkin: query.checkIn,
          checkout: query.checkOut,
          group_adults: String(Math.max(1, query.guests)),
        },
      ).toString()}`,
    };
  });
};

export const mockTransportOffers = (
  query: TransportSearchQuery,
): TransportOffer[] =>
  TRANSPORT_MODES.filter((mode) => !query.mode || mode === query.mode).map(
    (mode, i) => {
      const seed = `${query.origin}-${query.destination}-${query.date}-${mode}`;
      const durationMinutes = seededInt(seed, 30, 600);
      const { departUtc, arriveUtc } = leg(query.date, 7 + i, durationMinutes);
      return {
        id: `trn-${seed}`,
        type: 'transport',
        provider: 'MockMove',
        mode,
        origin: query.origin,
        destination: query.destination,
        departUtc,
        arriveUtc,
        durationMinutes,
        priceUsd: seededInt(seed, 15, 350),
      };
    },
  );

/** Convenience lookup re-exported for services that resolve a city name. */
export const cityName = (cityId: string): string =>
  MOCK_CITIES.find((city) => city.id === cityId)?.name ?? cityId;
