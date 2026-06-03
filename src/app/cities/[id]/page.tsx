import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCityById,
  getMatches,
  getNearbyCities,
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
  const [matches, nearby] = await Promise.all([
    getMatches({ cityId: id }),
    getNearbyCities(id),
  ]);

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

      {nearby.length > 0 ? (
        <section>
          <h2>Nearby host cities</h2>
          <ul className="nearby-cities">
            {nearby.map((other) => (
              <li key={other.id}>
                <Link href={`/cities/${other.id}`}>{other.name}</Link>
                <span className="muted">
                  {' '}
                  · {other.distanceKm.toLocaleString('en-US')} km
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <h2>Matches in {city.name}</h2>
      <MatchList matches={matches} />
    </div>
  );
};

export default CityPage;
