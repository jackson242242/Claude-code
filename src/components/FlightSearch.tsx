'use client';

import { type FormEvent, useState } from 'react';
import type { FlightOffer } from '@/types';
import { searchFlights } from '@/services/flightsService';
import { FlightCard } from './FlightCard';
import { SkeletonCard } from './SkeletonCard';

interface FlightSearchProps {
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDate?: string;
}

export const FlightSearch = ({
  defaultOrigin = '',
  defaultDestination = '',
  defaultDate = '2026-06-11',
}: FlightSearchProps) => {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [date, setDate] = useState(defaultDate);
  const [passengers, setPassengers] = useState(1);
  const [offers, setOffers] = useState<FlightOffer[]>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    try {
      setOffers(await searchFlights({ origin, destination, date, passengers }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search">
      <form className="search-form" onSubmit={onSubmit}>
        <input
          aria-label="Origin airport"
          placeholder="From (e.g. LHR)"
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
          required
        />
        <input
          aria-label="Destination airport"
          placeholder="To (e.g. JFK)"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          required
        />
        <input
          aria-label="Departure date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
        <input
          aria-label="Passengers"
          type="number"
          min={1}
          max={9}
          value={passengers}
          onChange={(event) => setPassengers(Number(event.target.value))}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search flights'}
        </button>
      </form>
      <div className="offer-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))
          : offers.map((offer) => (
              <FlightCard key={offer.id} offer={offer} />
            ))}
      </div>
    </div>
  );
};
