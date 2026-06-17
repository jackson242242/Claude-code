import type { GroupId, Match, MatchStage } from '@/types';

/**
 * The real 104-match 2026 FIFA World Cup schedule (11 Jun – 19 Jul 2026):
 * 72 group-stage fixtures from the 5 Dec 2025 draw plus 32 knockout slots
 * (bracket placeholders until results are known). Each fixture stores its
 * local kickoff; kickoffUtc is derived from the venue's summer UTC offset.
 * Mirrors the FastAPI seed (backend/app/seed/schedule_2026.py) one-to-one.
 * Source: openfootball/worldcup.json (public domain).
 */
interface Fixture {
  matchNumber: number;
  stage: MatchStage;
  group: GroupId | null;
  homeTeam: string;
  awayTeam: string;
  venueId: string;
  /** Local match date, YYYY-MM-DD. */
  date: string;
  /** Local kickoff time at the venue, HH:MM (24h). */
  time: string;
}

/** Approximate summer UTC offsets (hours) for each host city. */
const CITY_UTC_OFFSET: Record<string, number> = {
  'mexico-city': -6,
  guadalajara: -6,
  monterrey: -6,
  atlanta: -4,
  boston: -4,
  miami: -4,
  'new-york': -4,
  philadelphia: -4,
  toronto: -4,
  dallas: -5,
  houston: -5,
  'kansas-city': -5,
  'los-angeles': -7,
  'san-francisco': -7,
  seattle: -7,
  vancouver: -7,
};

const FIXTURES: Fixture[] = [
  { matchNumber: 1, stage: 'Group Stage', group: 'A', homeTeam: 'Mexico', awayTeam: 'South Africa', venueId: 'mexico-city', date: '2026-06-11', time: '13:00' },
  { matchNumber: 2, stage: 'Group Stage', group: 'A', homeTeam: 'South Korea', awayTeam: 'Czechia', venueId: 'guadalajara', date: '2026-06-11', time: '20:00' },
  { matchNumber: 3, stage: 'Group Stage', group: 'B', homeTeam: 'Canada', awayTeam: 'Bosnia & Herzegovina', venueId: 'toronto', date: '2026-06-12', time: '15:00' },
  { matchNumber: 4, stage: 'Group Stage', group: 'D', homeTeam: 'USA', awayTeam: 'Paraguay', venueId: 'los-angeles', date: '2026-06-12', time: '18:00' },
  { matchNumber: 5, stage: 'Group Stage', group: 'C', homeTeam: 'Haiti', awayTeam: 'Scotland', venueId: 'boston', date: '2026-06-13', time: '21:00' },
  { matchNumber: 6, stage: 'Group Stage', group: 'D', homeTeam: 'Australia', awayTeam: 'Turkey', venueId: 'vancouver', date: '2026-06-13', time: '21:00' },
  { matchNumber: 7, stage: 'Group Stage', group: 'C', homeTeam: 'Brazil', awayTeam: 'Morocco', venueId: 'new-york', date: '2026-06-13', time: '18:00' },
  { matchNumber: 8, stage: 'Group Stage', group: 'B', homeTeam: 'Qatar', awayTeam: 'Switzerland', venueId: 'san-francisco', date: '2026-06-13', time: '12:00' },
  { matchNumber: 9, stage: 'Group Stage', group: 'E', homeTeam: 'Ivory Coast', awayTeam: 'Ecuador', venueId: 'philadelphia', date: '2026-06-14', time: '19:00' },
  { matchNumber: 10, stage: 'Group Stage', group: 'E', homeTeam: 'Germany', awayTeam: 'Curaçao', venueId: 'houston', date: '2026-06-14', time: '12:00' },
  { matchNumber: 11, stage: 'Group Stage', group: 'F', homeTeam: 'Netherlands', awayTeam: 'Japan', venueId: 'dallas', date: '2026-06-14', time: '15:00' },
  { matchNumber: 12, stage: 'Group Stage', group: 'F', homeTeam: 'Sweden', awayTeam: 'Tunisia', venueId: 'monterrey', date: '2026-06-14', time: '20:00' },
  { matchNumber: 13, stage: 'Group Stage', group: 'H', homeTeam: 'Saudi Arabia', awayTeam: 'Uruguay', venueId: 'miami', date: '2026-06-15', time: '18:00' },
  { matchNumber: 14, stage: 'Group Stage', group: 'H', homeTeam: 'Spain', awayTeam: 'Cape Verde', venueId: 'atlanta', date: '2026-06-15', time: '12:00' },
  { matchNumber: 15, stage: 'Group Stage', group: 'G', homeTeam: 'Iran', awayTeam: 'New Zealand', venueId: 'los-angeles', date: '2026-06-15', time: '18:00' },
  { matchNumber: 16, stage: 'Group Stage', group: 'G', homeTeam: 'Belgium', awayTeam: 'Egypt', venueId: 'seattle', date: '2026-06-15', time: '12:00' },
  { matchNumber: 17, stage: 'Group Stage', group: 'I', homeTeam: 'France', awayTeam: 'Senegal', venueId: 'new-york', date: '2026-06-16', time: '15:00' },
  { matchNumber: 18, stage: 'Group Stage', group: 'I', homeTeam: 'Iraq', awayTeam: 'Norway', venueId: 'boston', date: '2026-06-16', time: '18:00' },
  { matchNumber: 19, stage: 'Group Stage', group: 'J', homeTeam: 'Argentina', awayTeam: 'Algeria', venueId: 'kansas-city', date: '2026-06-16', time: '20:00' },
  { matchNumber: 20, stage: 'Group Stage', group: 'J', homeTeam: 'Austria', awayTeam: 'Jordan', venueId: 'san-francisco', date: '2026-06-16', time: '21:00' },
  { matchNumber: 21, stage: 'Group Stage', group: 'L', homeTeam: 'Ghana', awayTeam: 'Panama', venueId: 'toronto', date: '2026-06-17', time: '19:00' },
  { matchNumber: 22, stage: 'Group Stage', group: 'L', homeTeam: 'England', awayTeam: 'Croatia', venueId: 'dallas', date: '2026-06-17', time: '15:00' },
  { matchNumber: 23, stage: 'Group Stage', group: 'K', homeTeam: 'Portugal', awayTeam: 'DR Congo', venueId: 'houston', date: '2026-06-17', time: '12:00' },
  { matchNumber: 24, stage: 'Group Stage', group: 'K', homeTeam: 'Uzbekistan', awayTeam: 'Colombia', venueId: 'mexico-city', date: '2026-06-17', time: '20:00' },
  { matchNumber: 25, stage: 'Group Stage', group: 'A', homeTeam: 'Czechia', awayTeam: 'South Africa', venueId: 'atlanta', date: '2026-06-18', time: '12:00' },
  { matchNumber: 26, stage: 'Group Stage', group: 'B', homeTeam: 'Switzerland', awayTeam: 'Bosnia & Herzegovina', venueId: 'los-angeles', date: '2026-06-18', time: '12:00' },
  { matchNumber: 27, stage: 'Group Stage', group: 'B', homeTeam: 'Canada', awayTeam: 'Qatar', venueId: 'vancouver', date: '2026-06-18', time: '15:00' },
  { matchNumber: 28, stage: 'Group Stage', group: 'A', homeTeam: 'Mexico', awayTeam: 'South Korea', venueId: 'guadalajara', date: '2026-06-18', time: '19:00' },
  { matchNumber: 29, stage: 'Group Stage', group: 'C', homeTeam: 'Brazil', awayTeam: 'Haiti', venueId: 'philadelphia', date: '2026-06-19', time: '20:30' },
  { matchNumber: 30, stage: 'Group Stage', group: 'C', homeTeam: 'Scotland', awayTeam: 'Morocco', venueId: 'boston', date: '2026-06-19', time: '18:00' },
  { matchNumber: 31, stage: 'Group Stage', group: 'D', homeTeam: 'Turkey', awayTeam: 'Paraguay', venueId: 'san-francisco', date: '2026-06-19', time: '20:00' },
  { matchNumber: 32, stage: 'Group Stage', group: 'D', homeTeam: 'USA', awayTeam: 'Australia', venueId: 'seattle', date: '2026-06-19', time: '12:00' },
  { matchNumber: 33, stage: 'Group Stage', group: 'E', homeTeam: 'Germany', awayTeam: 'Ivory Coast', venueId: 'toronto', date: '2026-06-20', time: '16:00' },
  { matchNumber: 34, stage: 'Group Stage', group: 'E', homeTeam: 'Ecuador', awayTeam: 'Curaçao', venueId: 'kansas-city', date: '2026-06-20', time: '19:00' },
  { matchNumber: 35, stage: 'Group Stage', group: 'F', homeTeam: 'Netherlands', awayTeam: 'Sweden', venueId: 'houston', date: '2026-06-20', time: '12:00' },
  { matchNumber: 36, stage: 'Group Stage', group: 'F', homeTeam: 'Tunisia', awayTeam: 'Japan', venueId: 'monterrey', date: '2026-06-20', time: '22:00' },
  { matchNumber: 37, stage: 'Group Stage', group: 'H', homeTeam: 'Uruguay', awayTeam: 'Cape Verde', venueId: 'miami', date: '2026-06-21', time: '18:00' },
  { matchNumber: 38, stage: 'Group Stage', group: 'H', homeTeam: 'Spain', awayTeam: 'Saudi Arabia', venueId: 'atlanta', date: '2026-06-21', time: '12:00' },
  { matchNumber: 39, stage: 'Group Stage', group: 'G', homeTeam: 'Belgium', awayTeam: 'Iran', venueId: 'los-angeles', date: '2026-06-21', time: '12:00' },
  { matchNumber: 40, stage: 'Group Stage', group: 'G', homeTeam: 'New Zealand', awayTeam: 'Egypt', venueId: 'vancouver', date: '2026-06-21', time: '18:00' },
  { matchNumber: 41, stage: 'Group Stage', group: 'I', homeTeam: 'Norway', awayTeam: 'Senegal', venueId: 'new-york', date: '2026-06-22', time: '20:00' },
  { matchNumber: 42, stage: 'Group Stage', group: 'I', homeTeam: 'France', awayTeam: 'Iraq', venueId: 'philadelphia', date: '2026-06-22', time: '17:00' },
  { matchNumber: 43, stage: 'Group Stage', group: 'J', homeTeam: 'Argentina', awayTeam: 'Austria', venueId: 'dallas', date: '2026-06-22', time: '12:00' },
  { matchNumber: 44, stage: 'Group Stage', group: 'J', homeTeam: 'Jordan', awayTeam: 'Algeria', venueId: 'san-francisco', date: '2026-06-22', time: '20:00' },
  { matchNumber: 45, stage: 'Group Stage', group: 'L', homeTeam: 'England', awayTeam: 'Ghana', venueId: 'boston', date: '2026-06-23', time: '16:00' },
  { matchNumber: 46, stage: 'Group Stage', group: 'L', homeTeam: 'Panama', awayTeam: 'Croatia', venueId: 'toronto', date: '2026-06-23', time: '19:00' },
  { matchNumber: 47, stage: 'Group Stage', group: 'K', homeTeam: 'Portugal', awayTeam: 'Uzbekistan', venueId: 'houston', date: '2026-06-23', time: '12:00' },
  { matchNumber: 48, stage: 'Group Stage', group: 'K', homeTeam: 'Colombia', awayTeam: 'DR Congo', venueId: 'guadalajara', date: '2026-06-23', time: '20:00' },
  { matchNumber: 49, stage: 'Group Stage', group: 'C', homeTeam: 'Scotland', awayTeam: 'Brazil', venueId: 'miami', date: '2026-06-24', time: '18:00' },
  { matchNumber: 50, stage: 'Group Stage', group: 'C', homeTeam: 'Morocco', awayTeam: 'Haiti', venueId: 'atlanta', date: '2026-06-24', time: '18:00' },
  { matchNumber: 51, stage: 'Group Stage', group: 'B', homeTeam: 'Switzerland', awayTeam: 'Canada', venueId: 'vancouver', date: '2026-06-24', time: '12:00' },
  { matchNumber: 52, stage: 'Group Stage', group: 'B', homeTeam: 'Bosnia & Herzegovina', awayTeam: 'Qatar', venueId: 'seattle', date: '2026-06-24', time: '12:00' },
  { matchNumber: 53, stage: 'Group Stage', group: 'A', homeTeam: 'Czechia', awayTeam: 'Mexico', venueId: 'mexico-city', date: '2026-06-24', time: '19:00' },
  { matchNumber: 54, stage: 'Group Stage', group: 'A', homeTeam: 'South Africa', awayTeam: 'South Korea', venueId: 'monterrey', date: '2026-06-24', time: '19:00' },
  { matchNumber: 55, stage: 'Group Stage', group: 'E', homeTeam: 'Curaçao', awayTeam: 'Ivory Coast', venueId: 'philadelphia', date: '2026-06-25', time: '16:00' },
  { matchNumber: 56, stage: 'Group Stage', group: 'E', homeTeam: 'Ecuador', awayTeam: 'Germany', venueId: 'new-york', date: '2026-06-25', time: '16:00' },
  { matchNumber: 57, stage: 'Group Stage', group: 'F', homeTeam: 'Japan', awayTeam: 'Sweden', venueId: 'dallas', date: '2026-06-25', time: '18:00' },
  { matchNumber: 58, stage: 'Group Stage', group: 'F', homeTeam: 'Tunisia', awayTeam: 'Netherlands', venueId: 'kansas-city', date: '2026-06-25', time: '18:00' },
  { matchNumber: 59, stage: 'Group Stage', group: 'D', homeTeam: 'Turkey', awayTeam: 'USA', venueId: 'los-angeles', date: '2026-06-25', time: '19:00' },
  { matchNumber: 60, stage: 'Group Stage', group: 'D', homeTeam: 'Paraguay', awayTeam: 'Australia', venueId: 'san-francisco', date: '2026-06-25', time: '19:00' },
  { matchNumber: 61, stage: 'Group Stage', group: 'I', homeTeam: 'Norway', awayTeam: 'France', venueId: 'boston', date: '2026-06-26', time: '15:00' },
  { matchNumber: 62, stage: 'Group Stage', group: 'I', homeTeam: 'Senegal', awayTeam: 'Iraq', venueId: 'toronto', date: '2026-06-26', time: '15:00' },
  { matchNumber: 63, stage: 'Group Stage', group: 'G', homeTeam: 'Egypt', awayTeam: 'Iran', venueId: 'seattle', date: '2026-06-26', time: '20:00' },
  { matchNumber: 64, stage: 'Group Stage', group: 'G', homeTeam: 'New Zealand', awayTeam: 'Belgium', venueId: 'vancouver', date: '2026-06-26', time: '20:00' },
  { matchNumber: 65, stage: 'Group Stage', group: 'H', homeTeam: 'Cape Verde', awayTeam: 'Saudi Arabia', venueId: 'houston', date: '2026-06-26', time: '19:00' },
  { matchNumber: 66, stage: 'Group Stage', group: 'H', homeTeam: 'Uruguay', awayTeam: 'Spain', venueId: 'guadalajara', date: '2026-06-26', time: '18:00' },
  { matchNumber: 67, stage: 'Group Stage', group: 'L', homeTeam: 'Panama', awayTeam: 'England', venueId: 'new-york', date: '2026-06-27', time: '17:00' },
  { matchNumber: 68, stage: 'Group Stage', group: 'L', homeTeam: 'Croatia', awayTeam: 'Ghana', venueId: 'philadelphia', date: '2026-06-27', time: '17:00' },
  { matchNumber: 69, stage: 'Group Stage', group: 'J', homeTeam: 'Algeria', awayTeam: 'Austria', venueId: 'kansas-city', date: '2026-06-27', time: '21:00' },
  { matchNumber: 70, stage: 'Group Stage', group: 'J', homeTeam: 'Jordan', awayTeam: 'Argentina', venueId: 'dallas', date: '2026-06-27', time: '21:00' },
  { matchNumber: 71, stage: 'Group Stage', group: 'K', homeTeam: 'Colombia', awayTeam: 'Portugal', venueId: 'miami', date: '2026-06-27', time: '19:30' },
  { matchNumber: 72, stage: 'Group Stage', group: 'K', homeTeam: 'DR Congo', awayTeam: 'Uzbekistan', venueId: 'atlanta', date: '2026-06-27', time: '19:30' },
  { matchNumber: 73, stage: 'Round of 32', group: null, homeTeam: 'Runner-up Group A', awayTeam: 'Runner-up Group B', venueId: 'los-angeles', date: '2026-06-28', time: '12:00' },
  { matchNumber: 74, stage: 'Round of 32', group: null, homeTeam: 'Winner Group E', awayTeam: '3rd: A/B/C/D/F', venueId: 'boston', date: '2026-06-29', time: '16:30' },
  { matchNumber: 75, stage: 'Round of 32', group: null, homeTeam: 'Winner Group F', awayTeam: 'Runner-up Group C', venueId: 'monterrey', date: '2026-06-29', time: '19:00' },
  { matchNumber: 76, stage: 'Round of 32', group: null, homeTeam: 'Winner Group C', awayTeam: 'Runner-up Group F', venueId: 'houston', date: '2026-06-29', time: '12:00' },
  { matchNumber: 77, stage: 'Round of 32', group: null, homeTeam: 'Winner Group I', awayTeam: '3rd: C/D/F/G/H', venueId: 'new-york', date: '2026-06-30', time: '17:00' },
  { matchNumber: 78, stage: 'Round of 32', group: null, homeTeam: 'Runner-up Group E', awayTeam: 'Runner-up Group I', venueId: 'dallas', date: '2026-06-30', time: '12:00' },
  { matchNumber: 79, stage: 'Round of 32', group: null, homeTeam: 'Winner Group A', awayTeam: '3rd: C/E/F/H/I', venueId: 'mexico-city', date: '2026-06-30', time: '19:00' },
  { matchNumber: 80, stage: 'Round of 32', group: null, homeTeam: 'Winner Group L', awayTeam: '3rd: E/H/I/J/K', venueId: 'atlanta', date: '2026-07-01', time: '12:00' },
  { matchNumber: 81, stage: 'Round of 32', group: null, homeTeam: 'Winner Group D', awayTeam: '3rd: B/E/F/I/J', venueId: 'san-francisco', date: '2026-07-01', time: '17:00' },
  { matchNumber: 82, stage: 'Round of 32', group: null, homeTeam: 'Winner Group G', awayTeam: '3rd: A/E/H/I/J', venueId: 'seattle', date: '2026-07-01', time: '13:00' },
  { matchNumber: 83, stage: 'Round of 32', group: null, homeTeam: 'Runner-up Group K', awayTeam: 'Runner-up Group L', venueId: 'toronto', date: '2026-07-02', time: '19:00' },
  { matchNumber: 84, stage: 'Round of 32', group: null, homeTeam: 'Winner Group H', awayTeam: 'Runner-up Group J', venueId: 'los-angeles', date: '2026-07-02', time: '12:00' },
  { matchNumber: 85, stage: 'Round of 32', group: null, homeTeam: 'Winner Group B', awayTeam: '3rd: E/F/G/I/J', venueId: 'vancouver', date: '2026-07-02', time: '20:00' },
  { matchNumber: 86, stage: 'Round of 32', group: null, homeTeam: 'Winner Group J', awayTeam: 'Runner-up Group H', venueId: 'miami', date: '2026-07-03', time: '18:00' },
  { matchNumber: 87, stage: 'Round of 32', group: null, homeTeam: 'Winner Group K', awayTeam: '3rd: D/E/I/J/L', venueId: 'kansas-city', date: '2026-07-03', time: '20:30' },
  { matchNumber: 88, stage: 'Round of 32', group: null, homeTeam: 'Runner-up Group D', awayTeam: 'Runner-up Group G', venueId: 'dallas', date: '2026-07-03', time: '13:00' },
  { matchNumber: 89, stage: 'Round of 16', group: null, homeTeam: 'Winner Match 74', awayTeam: 'Winner Match 77', venueId: 'philadelphia', date: '2026-07-04', time: '17:00' },
  { matchNumber: 90, stage: 'Round of 16', group: null, homeTeam: 'Winner Match 73', awayTeam: 'Winner Match 75', venueId: 'houston', date: '2026-07-04', time: '12:00' },
  { matchNumber: 91, stage: 'Round of 16', group: null, homeTeam: 'Winner Match 76', awayTeam: 'Winner Match 78', venueId: 'new-york', date: '2026-07-05', time: '16:00' },
  { matchNumber: 92, stage: 'Round of 16', group: null, homeTeam: 'Winner Match 79', awayTeam: 'Winner Match 80', venueId: 'mexico-city', date: '2026-07-05', time: '18:00' },
  { matchNumber: 93, stage: 'Round of 16', group: null, homeTeam: 'Winner Match 83', awayTeam: 'Winner Match 84', venueId: 'dallas', date: '2026-07-06', time: '14:00' },
  { matchNumber: 94, stage: 'Round of 16', group: null, homeTeam: 'Winner Match 81', awayTeam: 'Winner Match 82', venueId: 'seattle', date: '2026-07-06', time: '17:00' },
  { matchNumber: 95, stage: 'Round of 16', group: null, homeTeam: 'Winner Match 86', awayTeam: 'Winner Match 88', venueId: 'atlanta', date: '2026-07-07', time: '12:00' },
  { matchNumber: 96, stage: 'Round of 16', group: null, homeTeam: 'Winner Match 85', awayTeam: 'Winner Match 87', venueId: 'vancouver', date: '2026-07-07', time: '13:00' },
  { matchNumber: 97, stage: 'Quarter-final', group: null, homeTeam: 'Winner Match 89', awayTeam: 'Winner Match 90', venueId: 'boston', date: '2026-07-09', time: '16:00' },
  { matchNumber: 98, stage: 'Quarter-final', group: null, homeTeam: 'Winner Match 93', awayTeam: 'Winner Match 94', venueId: 'los-angeles', date: '2026-07-10', time: '12:00' },
  { matchNumber: 99, stage: 'Quarter-final', group: null, homeTeam: 'Winner Match 91', awayTeam: 'Winner Match 92', venueId: 'miami', date: '2026-07-11', time: '17:00' },
  { matchNumber: 100, stage: 'Quarter-final', group: null, homeTeam: 'Winner Match 95', awayTeam: 'Winner Match 96', venueId: 'kansas-city', date: '2026-07-11', time: '20:00' },
  { matchNumber: 101, stage: 'Semi-final', group: null, homeTeam: 'Winner Match 97', awayTeam: 'Winner Match 98', venueId: 'dallas', date: '2026-07-14', time: '14:00' },
  { matchNumber: 102, stage: 'Semi-final', group: null, homeTeam: 'Winner Match 99', awayTeam: 'Winner Match 100', venueId: 'atlanta', date: '2026-07-15', time: '15:00' },
  { matchNumber: 103, stage: 'Third-place', group: null, homeTeam: 'Loser Match 101', awayTeam: 'Loser Match 102', venueId: 'miami', date: '2026-07-18', time: '17:00' },
  { matchNumber: 104, stage: 'Final', group: null, homeTeam: 'Winner Match 101', awayTeam: 'Winner Match 102', venueId: 'new-york', date: '2026-07-19', time: '15:00' },
];

/** Builds local + UTC kickoff strings for a fixture. */
const buildMatch = (fixture: Fixture): Match => {
  const offset = CITY_UTC_OFFSET[fixture.venueId] ?? 0;
  const [year, month, day] = fixture.date.split('-').map(Number);
  const [hour, minute] = fixture.time.split(':').map(Number);
  const localMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const kickoffLocal = `${fixture.date}T${fixture.time}:00`;
  const kickoffUtc = new Date(localMs - offset * 3_600_000).toISOString();
  return {
    id: `M${fixture.matchNumber}`,
    matchNumber: fixture.matchNumber,
    stage: fixture.stage,
    group: fixture.group,
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    venueId: fixture.venueId,
    kickoffLocal,
    kickoffUtc,
    status: 'scheduled',
  };
};

export const MOCK_MATCHES: Match[] = FIXTURES.map(buildMatch);
