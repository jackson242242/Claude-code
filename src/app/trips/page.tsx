import type { Metadata } from 'next';
import { TripsView } from '@/components/TripsView';

export const metadata: Metadata = {
  title: 'My Trips · World Cup 2026 Tour Guide',
};

const TripsPage = () => (
  <div>
    <h1>My Trips</h1>
    <p className="lead">
      Plan multi-city trips around the matches you want to attend, then let the
      app suggest hotels and travel between host cities.
    </p>
    <TripsView />
  </div>
);

export default TripsPage;
