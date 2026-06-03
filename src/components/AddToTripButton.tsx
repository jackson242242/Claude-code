'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import type { AddTripItemInput, Match, TripSummary } from '@/types';
import { addTripItem, createTrip, listTrips } from '@/services/tripsService';

interface AddToTripButtonProps {
  match: Match;
  venueName: string;
}

export const AddToTripButton = ({ match, venueName }: AddToTripButtonProps) => {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const matchItem = (): AddTripItemInput => ({
    kind: 'match',
    matchId: match.id,
    cityId: match.venueId,
    title: `${match.homeTeam} vs ${match.awayTeam}`,
    subtitle: `${venueName} · ${match.kickoffLocal.slice(0, 10)}`,
    startsAt: match.kickoffLocal,
  });

  const openPanel = async (): Promise<void> => {
    setOpen(true);
    setError(null);
    if (!loaded) {
      try {
        setTrips(await listTrips());
        setLoaded(true);
      } catch {
        setError('Could not load your trips. Is the backend running?');
      }
    }
  };

  const addToTrip = async (tripId: string, name: string): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await addTripItem(tripId, matchItem());
      setStatus(`Added to “${name}”.`);
      setOpen(false);
    } catch {
      setError('Could not add this match to the trip.');
    } finally {
      setBusy(false);
    }
  };

  const createAndAdd = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const trip = await createTrip(newName.trim());
      await addTripItem(trip.id, matchItem());
      setStatus(`Added to “${trip.name}”.`);
      setNewName('');
      setOpen(false);
    } catch {
      setError('Could not create the trip.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="add-to-trip">
      {!open ? (
        <button type="button" className="btn" onClick={() => void openPanel()}>
          ＋ Add to a trip
        </button>
      ) : (
        <div className="add-to-trip__panel">
          <div className="add-to-trip__head">
            <strong>Add to a trip</strong>
            <button
              type="button"
              className="link-btn"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          {trips.length > 0 ? (
            <ul className="add-to-trip__list">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <button
                    type="button"
                    className="link-btn"
                    disabled={busy}
                    onClick={() => void addToTrip(trip.id, trip.name)}
                  >
                    {trip.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : loaded ? (
            <p className="muted">No trips yet — create one below.</p>
          ) : (
            <p className="muted">Loading…</p>
          )}
          <form className="add-to-trip__new" onSubmit={createAndAdd}>
            <input
              aria-label="New trip name"
              placeholder="New trip name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
            <button type="submit" disabled={busy}>
              Create &amp; add
            </button>
          </form>
        </div>
      )}
      {status ? (
        <p className="add-to-trip__status">
          {status} <Link href="/trips">View trips →</Link>
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
};
