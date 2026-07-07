import type { Confederation, GroupId, Team } from '@/types';

/**
 * 48 teams across 12 groups (A–L).
 *
 * Host nations are placed per the real draw (Mexico → A, Canada → B, USA → D).
 * The remaining group assignments are representative placeholders for this
 * foundation build and should be reconciled with the official FIFA draw.
 */
const GROUP_TEAMS: Record<GroupId, string[]> = {
  A: ['Mexico', 'Argentina', 'Croatia', 'Saudi Arabia'],
  B: ['Canada', 'Brazil', 'Belgium', 'Morocco'],
  C: ['France', 'Switzerland', 'Senegal', 'Qatar'],
  D: ['USA', 'Netherlands', 'Tunisia', 'Iran'],
  E: ['England', 'Denmark', 'Algeria', 'Iraq'],
  F: ['Spain', 'Poland', 'Nigeria', 'UAE'],
  G: ['Portugal', 'Serbia', 'Ghana', 'Japan'],
  H: ['Germany', 'Austria', 'Egypt', 'Korea Republic'],
  I: ['Uruguay', 'Ukraine', 'Ivory Coast', 'Australia'],
  J: ['Colombia', 'Wales', 'Cameroon', 'Ecuador'],
  K: ['Italy', 'Scotland', 'Turkey', 'Greece'],
  L: ['Norway', 'Sweden', 'Czechia', 'Hungary'],
};

const CONFEDERATIONS: Record<string, Confederation> = {
  Mexico: 'CONCACAF',
  USA: 'CONCACAF',
  Canada: 'CONCACAF',
  Argentina: 'CONMEBOL',
  Brazil: 'CONMEBOL',
  Uruguay: 'CONMEBOL',
  Colombia: 'CONMEBOL',
  Ecuador: 'CONMEBOL',
  France: 'UEFA',
  England: 'UEFA',
  Spain: 'UEFA',
  Portugal: 'UEFA',
  Germany: 'UEFA',
  Netherlands: 'UEFA',
  Belgium: 'UEFA',
  Croatia: 'UEFA',
  Italy: 'UEFA',
  Switzerland: 'UEFA',
  Denmark: 'UEFA',
  Poland: 'UEFA',
  Serbia: 'UEFA',
  Austria: 'UEFA',
  Ukraine: 'UEFA',
  Wales: 'UEFA',
  Scotland: 'UEFA',
  Turkey: 'UEFA',
  Norway: 'UEFA',
  Sweden: 'UEFA',
  Czechia: 'UEFA',
  Hungary: 'UEFA',
  Greece: 'UEFA',
  Japan: 'AFC',
  'Korea Republic': 'AFC',
  Australia: 'AFC',
  Iran: 'AFC',
  'Saudi Arabia': 'AFC',
  Qatar: 'AFC',
  Iraq: 'AFC',
  UAE: 'AFC',
  Morocco: 'CAF',
  Senegal: 'CAF',
  Tunisia: 'CAF',
  Algeria: 'CAF',
  Nigeria: 'CAF',
  Ghana: 'CAF',
  Egypt: 'CAF',
  'Ivory Coast': 'CAF',
  Cameroon: 'CAF',
};

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const buildTeams = (): Team[] => {
  const groups = Object.keys(GROUP_TEAMS) as GroupId[];
  return groups.flatMap((group) =>
    GROUP_TEAMS[group].map((name) => ({
      id: slugify(name),
      name,
      group,
      confederation: CONFEDERATIONS[name] ?? 'UEFA',
    })),
  );
};

export const MOCK_TEAMS: Team[] = buildTeams();
