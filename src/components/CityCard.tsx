import Link from 'next/link';
import type { City } from '@/types';

interface CityCardProps {
  city: City;
}

/** Deterministic vibrant gradient per city, used as the image-load fallback. */
const CITY_GRADIENTS = [
  'var(--gradient-pitch)',
  'var(--gradient-sunset)',
  'linear-gradient(135deg, #7c3bff 0%, #06b6d4 100%)',
  'var(--gradient-festival)',
] as const;

const gradientFor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CITY_GRADIENTS[hash % CITY_GRADIENTS.length];
};

// A deterministic per-city gradient is the card's artwork. (An earlier build
// layered a source.unsplash.com photo on top, but that service was retired and
// every request 404'd — so the gradient was all anyone ever saw. Dropping the
// dead <img> also lets this be a server component again: no client JS ships.)
export const CityCard = ({ city }: CityCardProps) => (
  <Link
    href={`/cities/${city.id}`}
    className="city-card"
    data-testid="city-card"
    data-ctx-kind="city"
    data-ctx-title={city.name}
    data-ctx-detail={`${city.country} · ${city.airports.join(' · ')}`}
    data-ctx-href={`/hotels?city=${city.id}`}
  >
    <div className="city-card__media" style={{ background: gradientFor(city.id) }}>
      <div className="city-card__overlay">
        <span className="city-card__name">{city.name}</span>
        <span className="city-card__country">{city.country}</span>
      </div>
    </div>
  </Link>
);
