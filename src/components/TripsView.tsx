'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import type { TripSummary } from '@/types';
import { createTrip, deleteTrip, listTrips } from '@/services/tripsService';
import { formatPriceUsd } from '@/lib/format';

export const TripsView = () => {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await listTrips();
        if (active) setTrips(result);
      } catch {
        if (active) setError('Could not load trips. Is the backend running?');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const reload = async (): Promise<void> => {
    try {
      setTrips(await listTrips());
    } catch {
      setError('Could not refresh trips.');
    }
  };

  const onCreate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createTrip(name.trim());
      setName('');
      await reload();
    } catch {
      setError('Could not create the trip.');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string): Promise<void> => {
    setBusy(true);
    try {
      await deleteTrip(id);
      await reload();
    } catch {
      setError('Could not delete the trip.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <form className="search-form" onSubmit={onCreate}>
        <input
          aria-label="New trip name"
          placeholder="Name your trip (e.g. Group stage in Texas)"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit" disabled={busy}>
          Create trip
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading your trips…</p> : null}

      {!loading && trips.length === 0 ? (
        <p className="empty">
          No trips yet. Create one above, or add a match from the{' '}
          <Link href="/schedule">schedule</Link>.
        </p>
      ) : null}

      <ul className="trip-list" data-testid="trip-list">
        {trips.map((trip) => (
          <li key={trip.id} className="trip-card">
            <Link href={`/trips/${trip.id}`} className="trip-card__main">
              <span className="trip-card__name">{trip.name}</span>
              <span className="trip-card__meta">
                {trip.itemCount} item{trip.itemCount === 1 ? '' : 's'} ·{' '}
                {formatPriceUsd(trip.totalUsd)}
              </span>
            </Link>
            <button
              type="button"
              className="link-btn"
              disabled={busy}
              onClick={() => onDelete(trip.id)}
              aria-label={`Delete ${trip.name}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
