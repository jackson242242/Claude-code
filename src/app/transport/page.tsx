import type { Metadata } from 'next';
import { TransportSearch } from '@/components/TransportSearch';

export const metadata: Metadata = {
  title: 'Transport · World Cup 2026 Tour Guide',
};

const TransportPage = () => (
  <div>
    <h1>Find transport</h1>
    <p className="lead">
      Trains, buses, shuttles and rideshares between and within host cities.
      Results are sample offers from a mock provider behind the transport
      adapter.
    </p>
    <TransportSearch />
  </div>
);

export default TransportPage;
