'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BookingSummary } from '@/types';
import { listBookings } from '@/services/bookingsService';
import { formatPriceUsd } from '@/lib/format';

export const BookingsView = () => {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await listBookings();
        if (active) setBookings(result);
      } catch {
        if (active) setError('Could not load bookings. Is the backend running?');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="muted">Loading bookings…</p>;
  if (error) return <p className="error">{error}</p>;
  if (bookings.length === 0) {
    return (
      <p className="empty">
        No bookings yet. Build a trip and reserve it from{' '}
        <Link href="/trips">My Trips</Link>.
      </p>
    );
  }

  return (
    <ul className="trip-list" data-testid="booking-list">
      {bookings.map((booking) => (
        <li key={booking.id} className="trip-card">
          <Link href={`/bookings/${booking.id}`} className="trip-card__main">
            <span className="trip-card__name">
              {booking.tripName}{' '}
              <span className={`status status--${booking.status}`}>
                {booking.status}
              </span>
            </span>
            <span className="trip-card__meta">
              {booking.confirmationCode} · {booking.lineCount} item
              {booking.lineCount === 1 ? '' : 's'} ·{' '}
              {formatPriceUsd(booking.totalUsd)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};
