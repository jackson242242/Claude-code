'use client';

import { type FormEvent, useState } from 'react';
import type { City, HotelOffer } from '@/types';
import { searchHotels } from '@/services/hotelsService';
import { HotelCard } from './HotelCard';
import { SkeletonCard } from './SkeletonCard';

interface HotelSearchProps {
  cities: City[];
  defaultCityId?: string;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
}

export const HotelSearch = ({
  cities,
  defaultCityId = '',
  defaultCheckIn = '2026-06-11',
  defaultCheckOut = '2026-06-14',
}: HotelSearchProps) => {
  const [cityId, setCityId] = useState(defaultCityId || cities[0]?.id || '');
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(2);
  const [offers, setOffers] = useState<HotelOffer[]>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    try {
      setOffers(await searchHotels({ cityId, checkIn, checkOut, guests }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search">
      <form className="search-form" onSubmit={onSubmit}>
        <select
          aria-label="Host city"
          value={cityId}
          onChange={(event) => setCityId(event.target.value)}
        >
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <input
          aria-label="Check-in date"
          type="date"
          value={checkIn}
          onChange={(event) => setCheckIn(event.target.value)}
          required
        />
        <input
          aria-label="Check-out date"
          type="date"
          value={checkOut}
          onChange={(event) => setCheckOut(event.target.value)}
          required
        />
        <input
          aria-label="Guests"
          type="number"
          min={1}
          max={8}
          value={guests}
          onChange={(event) => setGuests(Number(event.target.value))}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search hotels'}
        </button>
      </form>
      <div className="offer-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))
          : offers.map((offer) => (
              <HotelCard key={offer.id} offer={offer} />
            ))}
      </div>
    </div>
  );
};
