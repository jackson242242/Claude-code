'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkoutTrip } from '@/services/bookingsService';

interface CheckoutButtonProps {
  tripId: string;
  disabled?: boolean;
}

export const CheckoutButton = ({ tripId, disabled }: CheckoutButtonProps) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCheckout = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const booking = await checkoutTrip(tripId);
      router.push(`/bookings/${booking.id}`);
    } catch {
      setError('Could not reserve this trip. Add at least one item first.');
      setBusy(false);
    }
  };

  return (
    <div className="checkout">
      <button
        type="button"
        className="btn"
        onClick={onCheckout}
        disabled={busy || disabled}
      >
        {busy ? 'Reserving…' : 'Reserve this trip →'}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
};
