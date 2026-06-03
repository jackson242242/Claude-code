import type { City, NearbyCity } from '@/types';

const EARTH_RADIUS_KM = 6371;

const toRad = (degrees: number): number => (degrees * Math.PI) / 180;

/** Great-circle distance in kilometres, rounded to one decimal place. */
export const distanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lng2 - lng1);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLambda / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a)) * 10) / 10;
};

/** The closest host cities to `cityId`, nearest first. */
export const nearestCities = (
  cities: City[],
  cityId: string,
  limit = 3,
): NearbyCity[] => {
  const target = cities.find((city) => city.id === cityId);
  if (!target) return [];
  return cities
    .filter((city) => city.id !== cityId)
    .map((city) => ({
      id: city.id,
      name: city.name,
      country: city.country,
      distanceKm: distanceKm(target.lat, target.lng, city.lat, city.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
};
