'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SharedTrip } from '@/types';
import { getSharedTrip } from '@/services/tripsService';
import { sortTripItems } from '@/services/itinerary';
import { formatPriceUsd } from '@/lib/format';
import { TripItemRow } from './TripItemRow';

interface SharedTripViewProps {
  token: string;
}

export const SharedTripView = ({ token }: SharedTripViewProps) => {
  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await getSharedTrip(token);
        if (active) setTrip(loaded);
      } catch {
        if (active) setError('This shared trip could not be found.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) return <p className="muted">Loading trip…</p>;
  if (error || !trip) return <p className="error">{error ?? 'Not found.'}</p>;

  const items = sortTripItems(trip.items);

  return (
    <div>
      <Link href="/" className="back">
        ← Home
      </Link>
      <h1>{trip.name}</h1>
      <p className="lead">
        Shared itinerary · {trip.itemCount} item
        {trip.itemCount === 1 ? '' : 's'} ·{' '}
        <strong>{formatPriceUsd(trip.totalUsd)}</strong>
      </p>

      {items.length === 0 ? (
        <p className="empty">This trip has no items yet.</p>
      ) : (
        <ul className="trip-items">
          {items.map((item) => (
            <TripItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      <p className="muted">
        Planning your own? <Link href="/schedule">Browse the schedule →</Link>
      </p>
    </div>
  );
};
