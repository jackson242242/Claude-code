import type { Metadata } from 'next';
import { BookingsView } from '@/components/BookingsView';

export const metadata: Metadata = {
  title: 'Bookings · World Cup 2026 Tour Guide',
};

const BookingsPage = () => (
  <div>
    <h1>Bookings</h1>
    <p className="lead">
      Trips you have reserved. Each booking keeps a snapshot of your itinerary
      with links to complete each purchase.
    </p>
    <BookingsView />
  </div>
);

export default BookingsPage;
