import type { Match } from '@/types';
import { MatchCard } from './MatchCard';

interface MatchListProps {
  matches: Match[];
}

export const MatchList = ({ matches }: MatchListProps) => {
  if (matches.length === 0) {
    return <p className="empty">No matches found for the selected filters.</p>;
  }
  return (
    <ul className="match-list" data-testid="match-list">
      {matches.map((match) => (
        <li key={match.id} className="match-list__item">
          <MatchCard match={match} />
        </li>
      ))}
    </ul>
  );
};
