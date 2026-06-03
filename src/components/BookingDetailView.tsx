'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Booking } from '@/types';
import { getBooking } from '@/services/bookingsService';
import { formatPriceUsd } from '@/lib/format';

interface BookingDetailViewProps {
  bookingId: string;
}

const kindLabel = (kind: string): string =>
  kind.charAt(0).toUpperCase() + kind.slice(1);

export const BookingDetailView = ({ bookingId }: BookingDetailViewProps) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const result = await getBooking(bookingId);
        if (active) setBooking(result);
      } catch {
        if (active) setError('This booking could not be found.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (loading) return <p className="muted">Loading booking…</p>;
  if (error || !booking) return <p className="error">{error ?? 'Not found.'}</p>;

  return (
    <div>
      <Link href="/bookings" className="back">
        ← All bookings
      </Link>

      <div className="confirmation">
        <span className={`status status--${booking.status}`}>
          {booking.status === 'paid' ? 'Paid' : 'Reserved'}
        </span>
        <h1>{booking.tripName}</h1>
        <p className="lead">
          Confirmation <strong>{booking.confirmationCode}</strong> ·{' '}
          {formatPriceUsd(booking.totalUsd)} total
        </p>
        <p className="muted">
          {booking.paymentProvider === 'none'
            ? 'Reserved — complete each booking via the partner links below.'
            : `Paid via ${booking.paymentProvider}.`}
        </p>
      </div>

      <ul className="trip-items" data-testid="booking-lines">
        {booking.lines.map((line, index) => (
          <li key={`${line.kind}-${index}`} className="trip-item">
            <span className={`badge badge--${line.kind}`}>
              {kindLabel(line.kind)}
            </span>
            <span className="trip-item__main">
              <span className="trip-item__title">{line.title}</span>
              {line.subtitle ? (
                <span className="trip-item__subtitle">{line.subtitle}</span>
              ) : null}
            </span>
            {line.priceUsd > 0 ? (
              <span className="trip-item__price">
                {formatPriceUsd(line.priceUsd)}
              </span>
            ) : null}
            {line.deepLink ? (
              <a
                className="external-link"
                href={line.deepLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open ↗
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};
