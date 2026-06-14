import type { Confederation, GroupId, Team } from '@/types';

/**
 * The 48 teams of the 2026 FIFA World Cup, exactly as drawn on 5 Dec 2025,
 * across the 12 groups (A–L). Group order follows the draw pots.
 * Source: openfootball/worldcup.json (public domain).
 */
const GROUP_TEAMS: Record<GroupId, string[]> = {
  A: ['Mexico', 'South Korea', 'South Africa', 'Czechia'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Bosnia & Herzegovina'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['USA', 'Australia', 'Paraguay', 'Turkey'],
  E: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'],
  G: ['Belgium', 'Iran', 'Egypt', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],
  L: ['England', 'Croatia', 'Panama', 'Ghana'],
};

const CONFEDERATIONS: Record<string, Confederation> = {
  Mexico: 'CONCACAF',
  'South Korea': 'AFC',
  'South Africa': 'CAF',
  Czechia: 'UEFA',
  Canada: 'CONCACAF',
  Switzerland: 'UEFA',
  Qatar: 'AFC',
  'Bosnia & Herzegovina': 'UEFA',
  Brazil: 'CONMEBOL',
  Morocco: 'CAF',
  Scotland: 'UEFA',
  Haiti: 'CONCACAF',
  USA: 'CONCACAF',
  Australia: 'AFC',
  Paraguay: 'CONMEBOL',
  Turkey: 'UEFA',
  Germany: 'UEFA',
  Ecuador: 'CONMEBOL',
  'Ivory Coast': 'CAF',
  'Curaçao': 'CONCACAF',
  Netherlands: 'UEFA',
  Japan: 'AFC',
  Tunisia: 'CAF',
  Sweden: 'UEFA',
  Belgium: 'UEFA',
  Iran: 'AFC',
  Egypt: 'CAF',
  'New Zealand': 'OFC',
  Spain: 'UEFA',
  Uruguay: 'CONMEBOL',
  'Saudi Arabia': 'AFC',
  'Cape Verde': 'CAF',
  France: 'UEFA',
  Senegal: 'CAF',
  Norway: 'UEFA',
  Iraq: 'AFC',
  Argentina: 'CONMEBOL',
  Austria: 'UEFA',
  Algeria: 'CAF',
  Jordan: 'AFC',
  Portugal: 'UEFA',
  Colombia: 'CONMEBOL',
  Uzbekistan: 'AFC',
  'DR Congo': 'CAF',
  England: 'UEFA',
  Croatia: 'UEFA',
  Panama: 'CONCACAF',
  Ghana: 'CAF',
};

export const slugify = (name: string): string =>
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
