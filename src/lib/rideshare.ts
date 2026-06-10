/**
 * Transport deep links — make every transport card actionable on a phone.
 *
 * - Uber / Lyft: official universal-link formats that launch the installed
 *   app (falling back to mobile web) with pickup = the user's current
 *   location and the dropoff preset, so the live fare estimate appears right
 *   in the app. Dropoff is geo-anchored to the searched host city's
 *   stadium-area coordinates (src/mocks/cities.ts) — same anti-wrong-city
 *   rule as the hotel links. No affiliate ids exist for these (neither
 *   program has self-serve link commissions).
 * - Google Maps: the official Maps URLs API (`/maps/dir/?api=1`) with the
 *   travel mode mapped from our transport mode (train/bus/shuttle → transit,
 *   car rental → driving), so directions open one tap away.
 */

import type { TransportMode } from '@/types';
import { MOCK_CITIES } from '@/mocks/cities';

export interface RideshareLinks {
  /** Resolved host-city name the dropoff is anchored to. */
  cityName: string;
  uber: string;
  lyft: string;
}

const normalize = (value: string): string => value.trim().toLowerCase();

/**
 * Loosely resolve free-text input ("mexico-city", "Mexico City",
 * "Estadio Azteca, Mexico City") to a host city. Returns null when the text
 * doesn't reference any host city — callers should then hide the buttons
 * rather than deep-link somewhere wrong.
 */
export const resolveHostCity = (input: string) => {
  const needle = normalize(input);
  if (needle.length < 3) return null;
  return (
    MOCK_CITIES.find((city) => city.id === needle) ??
    MOCK_CITIES.find((city) => normalize(city.name) === needle) ??
    MOCK_CITIES.find(
      (city) =>
        needle.includes(normalize(city.name)) ||
        normalize(city.name).includes(needle),
    ) ??
    null
  );
};

/** Build Uber + Lyft universal links for a free-text destination, or null. */
export const rideshareLinksFor = (destination: string): RideshareLinks | null => {
  const city = resolveHostCity(destination);
  if (!city) return null;

  const lat = String(city.lat);
  const lng = String(city.lng);
  const nickname = `${city.name} (stadium area)`;

  const uber =
    'https://m.uber.com/ul/?' +
    new URLSearchParams({
      action: 'setPickup',
      pickup: 'my_location',
      'dropoff[latitude]': lat,
      'dropoff[longitude]': lng,
      'dropoff[nickname]': nickname,
    }).toString();

  const lyft =
    'https://ride.lyft.com/ridetype?' +
    new URLSearchParams({
      id: 'lyft',
      'destination[latitude]': lat,
      'destination[longitude]': lng,
    }).toString();

  return { cityName: city.name, uber, lyft };
};

/** Our transport modes → Google Maps `travelmode` values. */
const MAPS_TRAVEL_MODE: Record<TransportMode, string> = {
  train: 'transit',
  bus: 'transit',
  shuttle: 'transit',
  rideshare: 'driving',
  'car-rental': 'driving',
};

/**
 * Google Maps directions link for a transport leg. Free text is fine (Maps
 * geocodes it); when the text resolves to a host city we enrich it to
 * "City, Country" so directions land in the right country.
 */
export const googleMapsDirectionsLink = (
  origin: string,
  destination: string,
  mode: TransportMode,
): string => {
  const enrich = (value: string): string => {
    const city = resolveHostCity(value);
    return city ? `${city.name}, ${city.country}` : value;
  };
  return (
    'https://www.google.com/maps/dir/?' +
    new URLSearchParams({
      api: '1',
      origin: enrich(origin),
      destination: enrich(destination),
      travelmode: MAPS_TRAVEL_MODE[mode],
    }).toString()
  );
};
