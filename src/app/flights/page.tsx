import type { Metadata } from 'next';
import { FlightSearch } from '@/components/FlightSearch';

export const metadata: Metadata = {
  title: 'Flights · World Cup 2026 Tour Guide',
};

const FlightsPage = () => (
  <div>
    <h1>Find flights</h1>
    <p className="lead">
      Search flights to the host cities. Results are sample offers from a mock
      provider behind the flight adapter.
    </p>
    <FlightSearch />
  </div>
);

export default FlightsPage;
