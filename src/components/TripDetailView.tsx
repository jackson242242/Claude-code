'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  AddTripItemInput,
  CityStay,
  TravelLeg,
  Trip,
  TripSuggestions,
} from '@/types';
import {
  addTripItem,
  deleteTrip,
  getTrip,
  getTripSuggestions,
  removeTripItem,
  renameTrip,
} from '@/services/tripsService';
import { sortTripItems } from '@/services/itinerary';
import { formatDuration, formatPriceUsd } from '@/lib/format';
import { TripItemRow } from './TripItemRow';
import { ShareTripLink } from './ShareTripLink';
import { CheckoutButton } from './CheckoutButton';
import { TripCostSummary } from './TripCostSummary';

interface TripDetailViewProps {
  tripId: string;
}

export const TripDetailView = ({ tripId }: TripDetailViewProps) => {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [suggestions, setSuggestions] = useState<TripSuggestions | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await getTrip(tripId);
        if (!active) return;
        setTrip(loaded);
        setNameDraft(loaded.name);
        const suggested = await getTripSuggestions(tripId);
        if (active) setSuggestions(suggested);
      } catch {
        if (active) setError('Could not load this trip. Is the backend running?');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [tripId]);

  const applyUpdate = async (updated: Trip): Promise<void> => {
    setTrip(updated);
    try {
      setSuggestions(await getTripSuggestions(tripId));
    } catch {
      // Suggestions are best-effort; keep the previous set on failure.
    }
  };

  const onAdd = async (item: AddTripItemInput): Promise<void> => {
    setBusy(true);
    try {
      await applyUpdate(await addTripItem(tripId, item));
    } catch {
      setError('Could not add that item.');
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async (itemId: string): Promise<void> => {
    setBusy(true);
    try {
      await applyUpdate(await removeTripItem(tripId, itemId));
    } catch {
      setError('Could not remove that item.');
    } finally {
      setBusy(false);
    }
  };

  const onRename = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!nameDraft.trim()) return;
    try {
      setTrip(await renameTrip(tripId, nameDraft.trim()));
    } catch {
      setError('Could not rename the trip.');
    }
  };

  const onDeleteTrip = async (): Promise<void> => {
    try {
      await deleteTrip(tripId);
      router.push('/trips');
    } catch {
      setError('Could not delete the trip.');
    }
  };

  const hotelItem = (stay: CityStay): AddTripItemInput | null =>
    stay.hotel
      ? {
          kind: 'hotel',
          cityId: stay.cityId,
          title: stay.hotel.name,
          subtitle: `${stay.cityName} · ${stay.nights} night${
            stay.nights === 1 ? '' : 's'
          } from ${stay.checkIn}`,
          priceUsd: stay.hotel.priceUsd,
          startsAt: stay.checkIn,
        }
      : null;

  const flightItem = (leg: TravelLeg): AddTripItemInput | null =>
    leg.flight
      ? {
          kind: 'flight',
          cityId: leg.toCityId,
          title: `${leg.flight.airline} · ${leg.flight.origin}→${leg.flight.destination}`,
          subtitle: `${leg.fromCityName} → ${leg.toCityName} · ${leg.date}`,
          priceUsd: leg.flight.priceUsd,
          startsAt: leg.date,
        }
      : null;

  const transportItem = (leg: TravelLeg): AddTripItemInput | null =>
    leg.transport
      ? {
          kind: 'transport',
          cityId: leg.toCityId,
          title: `${leg.transport.mode} · ${leg.fromCityName} → ${leg.toCityName}`,
          subtitle: `${leg.date} · ${formatDuration(leg.transport.durationMinutes)}`,
          priceUsd: leg.transport.priceUsd,
          startsAt: leg.date,
        }
      : null;

  if (loading) return <p className="muted">Loading trip…</p>;
  if (error && !trip) return <p className="error">{error}</p>;
  if (!trip) return <p className="empty">Trip not found.</p>;

  const items = sortTripItems(trip.items);

  return (
    <div className="trip-detail">
      <Link href="/trips" className="back">
        ← All trips
      </Link>

      <form className="trip-detail__title" onSubmit={onRename}>
        <input
          aria-label="Trip name"
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
        />
        <button type="submit">Save</button>
      </form>

      <p className="lead">
        {trip.itemCount} item{trip.itemCount === 1 ? '' : 's'}
      </p>

      <TripCostSummary items={items} totalUsd={trip.totalUsd} />

      {error ? <p className="error">{error}</p> : null}

      <section>
        <h2>Itinerary</h2>
        {items.length === 0 ? (
          <p className="empty">
            Nothing here yet. Add matches from the{' '}
            <Link href="/schedule">schedule</Link>, then pick hotels and travel
            from the suggestions below.
          </p>
        ) : (
          <ul className="trip-items">
            {items.map((item) => (
              <TripItemRow key={item.id} item={item} onRemove={onRemove} />
            ))}
          </ul>
        )}
      </section>

      {suggestions &&
      (suggestions.cityStays.length > 0 || suggestions.legs.length > 0) ? (
        <section className="suggestions">
          <h2>Suggested for your matches</h2>

          {suggestions.cityStays.map((stay) => (
            <div key={`stay-${stay.cityId}`} className="suggestion">
              <div className="suggestion__info">
                <strong>Stay in {stay.cityName}</strong>
                <span className="muted">
                  {stay.checkIn} → {stay.checkOut} · {stay.nights} night
                  {stay.nights === 1 ? '' : 's'}
                  {stay.hotel
                    ? ` · ${stay.hotel.name} · ${formatPriceUsd(stay.hotel.priceUsd)}`
                    : ''}
                </span>
              </div>
              {hotelItem(stay) ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const item = hotelItem(stay);
                    if (item) void onAdd(item);
                  }}
                >
                  Add hotel
                </button>
              ) : null}
            </div>
          ))}

          {suggestions.legs.map((leg, index) => (
            <div key={`leg-${index}`} className="suggestion">
              <div className="suggestion__info">
                <strong>
                  {leg.fromCityName} → {leg.toCityName}
                </strong>
                <span className="muted">
                  {leg.date}
                  {leg.flight
                    ? ` · ✈ ${leg.flight.airline} ${formatPriceUsd(leg.flight.priceUsd)}`
                    : ''}
                  {leg.transport
                    ? ` · ${leg.transport.mode} ${formatPriceUsd(leg.transport.priceUsd)}`
                    : ''}
                </span>
              </div>
              <div className="suggestion__actions">
                {flightItem(leg) ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const item = flightItem(leg);
                      if (item) void onAdd(item);
                    }}
                  >
                    Add flight
                  </button>
                ) : null}
                {transportItem(leg) ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const item = transportItem(leg);
                      if (item) void onAdd(item);
                    }}
                  >
                    Add transport
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="trip-detail__checkout">
        <h2>Reserve</h2>
        <p className="muted">
          Snapshot this itinerary into a booking with links to complete each
          purchase.
        </p>
        <CheckoutButton tripId={trip.id} disabled={trip.itemCount === 0} />
      </section>

      <section className="trip-detail__share">
        <h2>Share</h2>
        <p className="muted">Anyone with this link can view (not edit) the trip.</p>
        <ShareTripLink shareToken={trip.shareToken} />
      </section>

      <button
        type="button"
        className="danger-btn"
        onClick={onDeleteTrip}
        disabled={busy}
      >
        Delete trip
      </button>
    </div>
  );
};
