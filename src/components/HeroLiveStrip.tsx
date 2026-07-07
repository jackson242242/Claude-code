import Link from 'next/link';
import type { Match } from '@/types';
import { getVenueById } from '@/services/venues';
import { getMatchPhase } from '@/services/matchPhase';
import { getFlag } from '@/lib/flags';
import { DEFAULT_LOCALE, translator, type Locale } from '@/i18n';

interface HeroLiveStripProps {
  matches: Match[];
  /** Server render instant (ms epoch) — keeps phase derivation testable. */
  now: number;
  /** Viewer locale for the strip's labels (badge, phases, rest-day copy). */
  locale?: Locale;
}

/** Local wall-clock kickoff time ("HH:MM") for the compact strip. */
const kickoffTime = (local: string): string => local.slice(11, 16);

/**
 * Replaces the hero countdown once the tournament is underway: a LIVE badge
 * plus a compact strip of today's matches (or a schedule link on rest days).
 * Each match shows its current phase — kickoff time while upcoming, a pulsing
 * "In progress" while underway, "FT" once finished.
 */
export const HeroLiveStrip = ({
  matches,
  now,
  locale = DEFAULT_LOCALE,
}: HeroLiveStripProps) => {
  const t = translator(locale);
  return (
  <div className="hero__live" data-testid="hero-live-strip">
    <span className="hero__live-badge">
      <span className="hero__live-dot" aria-hidden="true" />
      {t('live.badge')}
    </span>
    {matches.length > 0 ? (
      <ul className="hero__live-matches" aria-label={t('live.todaysMatches')}>
        {matches.map((match) => {
          const venue = getVenueById(match.venueId);
          const phase = getMatchPhase(match, now);
          const linkClass =
            phase === 'inProgress'
              ? 'hero__live-match hero__live-match--live'
              : phase === 'fullTime'
                ? 'hero__live-match hero__live-match--ft'
                : 'hero__live-match';
          return (
            <li key={match.id}>
              <Link className={linkClass} href={`/matches/${match.id}`}>
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
                  {phase === 'inProgress' ? (
                    <span className="hero__live-now">
                      {t('live.inProgress')}
                    </span>
                  ) : phase === 'fullTime' ? (
                    t('live.fullTime')
                  ) : (
                    kickoffTime(match.kickoffLocal)
                  )}
                  {venue ? ` · ${venue.name}` : ''}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    ) : (
      <span className="hero__live-rest">{t('live.restDay')}</span>
    )}
    <Link className="hero__live-all" href="/schedule">
      {t('live.fullSchedule')}
    </Link>
  </div>
  );
};
