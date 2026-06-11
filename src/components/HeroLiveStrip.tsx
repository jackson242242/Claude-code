import Link from 'next/link';
import type { Match } from '@/types';
import { getVenueById } from '@/services/scheduleService';
import { getFlag } from '@/lib/flags';

interface HeroLiveStripProps {
  matches: Match[];
}

/** Local wall-clock kickoff time ("HH:MM") for the compact strip. */
const kickoffTime = (local: string): string => local.slice(11, 16);

/**
 * Replaces the hero countdown once the tournament is underway: a LIVE badge
 * plus a compact strip of today's matches (or a schedule link on rest days).
 */
export const HeroLiveStrip = ({ matches }: HeroLiveStripProps) => (
  <div className="hero__live" data-testid="hero-live-strip">
    <span className="hero__live-badge">
      <span className="hero__live-dot" aria-hidden="true" />
      LIVE NOW
    </span>
    {matches.length > 0 ? (
      <ul className="hero__live-matches" aria-label="Today's matches">
        {matches.map((match) => {
          const venue = getVenueById(match.venueId);
          return (
            <li key={match.id}>
              <Link className="hero__live-match" href={`/matches/${match.id}`}>
                <span className="hero__live-teams">
                  {getFlag(match.homeTeam) && (
                    <span aria-hidden="true">{getFlag(match.homeTeam)} </span>
                  )}
                  {match.homeTeam}
                  <span className="hero__live-vs"> vs </span>
                  {getFlag(match.awayTeam) && (
                    <span aria-hidden="true">{getFlag(match.awayTeam)} </span>
                  )}
                  {match.awayTeam}
                </span>
                <span className="hero__live-meta">
                  {kickoffTime(match.kickoffLocal)}
                  {venue ? ` · ${venue.name}` : ''}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    ) : (
      <span className="hero__live-rest">
        Rest day — knockout action resumes soon
      </span>
    )}
    <Link className="hero__live-all" href="/schedule">
      Full schedule →
    </Link>
  </div>
);
