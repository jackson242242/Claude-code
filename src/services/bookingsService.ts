import type { Booking, BookingSummary } from '@/types';
import { authedFetch } from './authedClient';

export const checkoutTrip = (tripId: string): Promise<Booking> =>
  authedFetch<Booking>(`/trips/${tripId}/checkout`, { method: 'POST' });

export const listBookings = (): Promise<BookingSummary[]> =>
  authedFetch<BookingSummary[]>('/bookings');

export const getBooking = (id: string): Promise<Booking> =>
  authedFetch<Booking>(`/bookings/${id}`);
