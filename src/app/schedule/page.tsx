import type { Metadata } from 'next';
import { getCities, getMatches, getTeams } from '@/services/scheduleService';
import { ScheduleView } from '@/components/ScheduleView';

export const metadata: Metadata = {
  title: 'Schedule · World Cup 2026 Tour Guide',
};

const SchedulePage = async () => {
  const [matches, cities, teams] = await Promise.all([
    getMatches(),
    getCities(),
    getTeams(),
  ]);

  return (
    <div>
      <h1>2026 World Cup Schedule</h1>
      <p className="lead">
        All {matches.length} matches. Filter by team, host city, group or stage.
      </p>
      <ScheduleView matches={matches} cities={cities} teams={teams} />
    </div>
  );
};

export default SchedulePage;
