import type { Metadata } from 'next';
import { getCities } from '@/services/scheduleService';
import { HotelSearch } from '@/components/HotelSearch';

export const metadata: Metadata = {
  title: 'Hotels · World Cup 2026 Tour Guide',
};

const HotelsPage = async () => {
  const cities = await getCities();
  return (
    <div>
      <h1>Find hotels</h1>
      <p className="lead">
        Search hotels near each host venue. Results are sample offers from a mock
        provider behind the hotel adapter.
      </p>
      <HotelSearch cities={cities} />
    </div>
  );
};

export default HotelsPage;
