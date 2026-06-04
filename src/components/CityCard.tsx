import Link from 'next/link';
import type { City } from '@/types';

interface CityCardProps {
  city: City;
}

export const CityCard = ({ city }: CityCardProps) => (
  <Link href={`/cities/${city.id}`} className="city-card" data-testid="city-card">
    <img
      src={`https://source.unsplash.com/400x200/?${encodeURIComponent(city.name)},cityscape`}
      alt={city.name}
      className="city-card__image"
    />
    <div className="city-card__body">
      <span className="city-card__name">{city.name}</span>
      <span className="city-card__country">{city.country}</span>
      <span className="city-card__airports">{city.airports.join(' · ')}</span>
    </div>
  </Link>
);
