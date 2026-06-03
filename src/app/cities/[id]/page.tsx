import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCityById,
  getMatches,
  getVenueById,
} from '@/services/scheduleService';
import { MatchList } from '@/components/MatchList';
import { VenueInfo } from '@/components/VenueInfo';

interface CityPageProps {
  params: Promise<{ id: string }>;
}

const CityPage = async ({ params }: CityPageProps) => {
  const { id } = await params;
  const city = await getCityById(id);
  if (!city) notFound();

  const venue = getVenueById(id);
  const matches = await getMatches({ cityId: id });

  return (
    <div>
      <Link href="/" className="back">
        ← Home
      </Link>
      <h1>{city.name}</h1>
      <p className="lead">
        {city.country} · {city.airports.join(', ')}
      </p>

      {venue ? <VenueInfo venue={venue} city={city} /> : null}

      <h2>Matches in {city.name}</h2>
      <MatchList matches={matches} />
    </div>
  );
};

export default CityPage;
