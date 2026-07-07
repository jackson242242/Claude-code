/**
 * Tournament-local time helpers.
 *
 * Match `kickoffLocal` values are each venue's own wall-clock time, but the
 * host cities span UTC−4 to UTC−8. A naive UTC "today" (from `toISOString()`)
 * rolls to the next calendar day during Americas evenings — exactly when
 * knockout matches kick off — so the live strip would drop tonight's games.
 *
 * We anchor "today" to America/New_York (the final venue, and the latest host
 * time zone, so its date never lags a venue that is still mid-evening). This is
 * correct for the whole eastern/central/Mexico bulk of venues and the vast
 * majority of the evening window; only late-night Pacific kickoffs can differ.
 */
const TOURNAMENT_TIME_ZONE = 'America/New_York';

/** YYYY-MM-DD for `now` (ms epoch) in the tournament's anchor time zone. */
export const tournamentToday = (now: number): string => {
  // en-CA formats as YYYY-MM-DD, which is exactly the prefix the match
  // `date` filter compares against `kickoffLocal`.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TOURNAMENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now));
};
