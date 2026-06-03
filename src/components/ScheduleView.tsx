'use client';

import { useMemo, useState } from 'react';
import type {
  City,
  GroupId,
  Match,
  MatchFilters,
  MatchStage,
  Team,
} from '@/types';
import { filterMatches, sortByKickoff } from '@/services/matchFilters';
import { MatchList } from './MatchList';

interface ScheduleViewProps {
  matches: Match[];
  cities: City[];
  teams: Team[];
}

const STAGES: MatchStage[] = [
  'Group Stage',
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Third-place',
  'Final',
];

const GROUPS: GroupId[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
];

export const ScheduleView = ({ matches, cities, teams }: ScheduleViewProps) => {
  const [filters, setFilters] = useState<MatchFilters>({});

  const visible = useMemo(
    () => sortByKickoff(filterMatches(matches, filters)),
    [matches, filters],
  );

  const update = (patch: Partial<MatchFilters>): void =>
    setFilters((prev) => ({ ...prev, ...patch }));

  return (
    <section>
      <div className="filters" data-testid="schedule-filters">
        <input
          type="search"
          list="team-options"
          placeholder="Search team…"
          aria-label="Search team"
          value={filters.team ?? ''}
          onChange={(event) =>
            update({ team: event.target.value || undefined })
          }
        />
        <datalist id="team-options">
          {teams.map((team) => (
            <option key={team.id} value={team.name} />
          ))}
        </datalist>

        <select
          aria-label="Host city"
          value={filters.cityId ?? ''}
          onChange={(event) =>
            update({ cityId: event.target.value || undefined })
          }
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Group"
          value={filters.group ?? ''}
          onChange={(event) =>
            update({
              group: event.target.value
                ? (event.target.value as GroupId)
                : undefined,
            })
          }
        >
          <option value="">All groups</option>
          {GROUPS.map((group) => (
            <option key={group} value={group}>
              Group {group}
            </option>
          ))}
        </select>

        <select
          aria-label="Stage"
          value={filters.stage ?? ''}
          onChange={(event) =>
            update({
              stage: event.target.value
                ? (event.target.value as MatchStage)
                : undefined,
            })
          }
        >
          <option value="">All stages</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <button type="button" onClick={() => setFilters({})}>
          Reset
        </button>
      </div>

      <p className="count" data-testid="match-count">
        {visible.length} match{visible.length === 1 ? '' : 'es'}
      </p>
      <MatchList matches={visible} />
    </section>
  );
};
