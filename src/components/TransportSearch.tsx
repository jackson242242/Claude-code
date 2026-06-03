'use client';

import { type FormEvent, useState } from 'react';
import type { TransportMode, TransportOffer } from '@/types';
import { searchTransport } from '@/services/transportService';
import { TransportCard } from './TransportCard';

interface TransportSearchProps {
  defaultOrigin?: string;
  defaultDestination?: string;
  defaultDate?: string;
}

const MODES: Array<{ value: '' | TransportMode; label: string }> = [
  { value: '', label: 'Any mode' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'rideshare', label: 'Rideshare' },
  { value: 'shuttle', label: 'Shuttle' },
  { value: 'car-rental', label: 'Car rental' },
];

export const TransportSearch = ({
  defaultOrigin = '',
  defaultDestination = '',
  defaultDate = '2026-06-11',
}: TransportSearchProps) => {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [date, setDate] = useState(defaultDate);
  const [mode, setMode] = useState<'' | TransportMode>('');
  const [offers, setOffers] = useState<TransportOffer[]>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    try {
      setOffers(
        await searchTransport({
          origin,
          destination,
          date,
          mode: mode || undefined,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search">
      <form className="search-form" onSubmit={onSubmit}>
        <input
          aria-label="Origin"
          placeholder="From (city or stadium)"
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
          required
        />
        <input
          aria-label="Destination"
          placeholder="To (city or stadium)"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          required
        />
        <input
          aria-label="Travel date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
        <select
          aria-label="Transport mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as '' | TransportMode)}
        >
          {MODES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search transport'}
        </button>
      </form>
      <div className="offer-grid">
        {offers.map((offer) => (
          <TransportCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
};
