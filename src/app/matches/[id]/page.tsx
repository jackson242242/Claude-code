import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCities,
  getCityById,
  getMatchById,
  getVenueById,
} from '@/services/scheduleService';
import { NearbyOptions } from '@/components/NearbyOptions';
import { formatKickoff } from '@/lib/format';

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

const MatchPage = async ({ params }: MatchPageProps) => {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const venue = getVenueById(match.venueId);
  const [city, cities] = await Promise.all([
    getCityById(match.venueId),
    getCities(),
  ]);

  return (
    <div className="match-detail">
      <Link href="/schedule" className="back">
        ← Back to schedule
      </Link>
      <h1>
        {match.homeTeam} vs {match.awayTeam}
      </h1>
      <p className="lead">
        {match.stage}
        {match.group ? ` · Group ${match.group}` : ''} ·{' '}
        {formatKickoff(match.kickoffLocal)}
      </p>

      {venue ? (
        <NearbyOptions match={match} venue={venue} city={city} cities={cities} />
      ) : (
        <p className="empty">Venue details are unavailable for this match.</p>
      )}
    </div>
  );
};

export default MatchPage;
