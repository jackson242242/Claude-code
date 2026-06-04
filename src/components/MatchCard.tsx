import Link from 'next/link';
import type { Match } from '@/types';
import { getVenueById } from '@/services/scheduleService';
import { formatKickoff } from '@/lib/format';
import { getFlag } from '@/lib/flags';

interface MatchCardProps {
  match: Match;
}

export const MatchCard = ({ match }: MatchCardProps) => {
  const venue = getVenueById(match.venueId);
  return (
    <Link
      href={`/matches/${match.id}`}
      className="match-card"
      data-testid="match-card"
    >
      <div className="match-card__head">
        <span className="match-card__stage">
          {match.stage}
          {match.group ? ` · Group ${match.group}` : ''}
        </span>
        <span className="match-card__num">#{match.matchNumber}</span>
      </div>
      <div className="match-card__teams">
        <span className="match-card__team">
          {getFlag(match.homeTeam) && (
            <span className="match-card__flag" aria-hidden="true">{getFlag(match.homeTeam)}</span>
          )}
          <span className="match-card__team-name">{match.homeTeam}</span>
        </span>
        <span className="match-card__vs">vs</span>
        <span className="match-card__team">
          {getFlag(match.awayTeam) && (
            <span className="match-card__flag" aria-hidden="true">{getFlag(match.awayTeam)}</span>
          )}
          <span className="match-card__team-name">{match.awayTeam}</span>
        </span>
      </div>
      <div className="match-card__meta">
        <span>{formatKickoff(match.kickoffLocal)}</span>
        <span>{venue ? venue.name : match.venueId}</span>
      </div>
    </Link>
  );
};
