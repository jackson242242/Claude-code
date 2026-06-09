/**
 * Seed data for the News module (Phase 0).
 *
 * HONESTY RULES:
 * - Schedule / city items drawn from real logistical data; source = "Matchday26".
 * - Player / team items are illustrative sample editorial; source = "Matchday26 Editorial".
 * - No fabricated breaking news. No political / legal content.
 * - Deterministic — no Math.random() at module scope.
 */
import type { NewsItem, PlayerSpotlight, TeamBrief } from '@/types/news';

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'news-01',
    category: 'video',
    title: 'Inside MetLife: A Tour of the World Cup Final Venue',
    summary:
      'Walk through the corridors of MetLife Stadium in East Rutherford, NJ — the venue chosen to host the 2026 World Cup Final. Capacity, sightlines, and match-day logistics explained.',
    source: 'Matchday26',
    publishedIso: '2026-06-08T10:00:00Z',
    thumbnailKind: 'teal-to-turquoise',
    videoSeconds: 214,
    cityId: 'new-york',
    ctaCityId: 'new-york',
  },
  {
    id: 'news-02',
    category: 'schedule',
    title: 'Group Stage Fixture Guide: Every Match, Every City',
    summary:
      'The Group Stage runs from 11 June to 1 July across all 16 host cities. Here is a city-by-city breakdown of kick-off times (local) and stadium transport options.',
    source: 'Matchday26',
    publishedIso: '2026-06-07T14:30:00Z',
    thumbnailKind: 'citrus-to-teal',
    minutesRead: 6,
    ctaCityId: 'los-angeles',
  },
  {
    id: 'news-03',
    category: 'city',
    title: 'Dallas–Arlington: No Train, But Great Shuttles',
    summary:
      'AT&T Stadium sits in Arlington — a suburb without light rail. Official event shuttles from Cowboys Way and rideshare pick-up zones make match-day travel smooth if you plan ahead.',
    source: 'Matchday26',
    publishedIso: '2026-06-06T09:15:00Z',
    thumbnailKind: 'turquoise-to-grape',
    minutesRead: 4,
    cityId: 'dallas',
    ctaCityId: 'dallas',
  },
  {
    id: 'news-04',
    category: 'team',
    title: 'Brazil\'s Build-Up: High Press and the Midfield Blueprint',
    summary:
      'Matchday26 Editorial takes a closer look at Brazil\'s tactical approach in their recent pre-tournament friendlies — a compact midfield block transitioning into fast counter-attacks.',
    source: 'Matchday26 Editorial',
    publishedIso: '2026-06-05T16:00:00Z',
    thumbnailKind: 'coral-to-gold',
    minutesRead: 5,
    teamName: 'Brazil',
    ctaCityId: 'houston',
  },
  {
    id: 'news-05',
    category: 'player',
    title: 'Five Midfielders to Watch in the Group Stage',
    summary:
      'From deep-lying playmakers to box-to-box engines, these five midfielders could define their team\'s tournament in the opening weeks. Illustrative form notes from friendly fixtures.',
    source: 'Matchday26 Editorial',
    publishedIso: '2026-06-04T11:00:00Z',
    thumbnailKind: 'grape-to-turquoise',
    minutesRead: 7,
  },
  {
    id: 'news-06',
    category: 'video',
    title: 'Vancouver Fan Zone: What to Expect at BC Place',
    summary:
      'BC Place opens its Fan Zone three hours before kick-off on match days. Food stalls, cultural programming, and SkyTrain connections are covered in this short preview.',
    source: 'Matchday26',
    publishedIso: '2026-06-03T13:00:00Z',
    thumbnailKind: 'turquoise-to-grape',
    videoSeconds: 168,
    cityId: 'vancouver',
    ctaCityId: 'vancouver',
  },
  {
    id: 'news-07',
    category: 'schedule',
    title: 'Round of 32 Bracket Explained: How the 48-Team Format Works',
    summary:
      'For the first time, 48 nations compete in a six-group-of-eight format with a round of 32. Here is how third-place finishers qualify and what the knockout bracket looks like.',
    source: 'Matchday26',
    publishedIso: '2026-06-02T08:00:00Z',
    thumbnailKind: 'citrus-to-teal',
    minutesRead: 5,
  },
  {
    id: 'news-08',
    category: 'city',
    title: 'Miami Match-Day Transport: Tri-Rail + Event Shuttle Guide',
    summary:
      'Hard Rock Stadium in Miami Gardens is a 30-minute Tri-Rail ride from Miami Central. Our step-by-step guide covers ticket zones, connecting buses, and rideshare staging areas.',
    source: 'Matchday26',
    publishedIso: '2026-06-01T09:00:00Z',
    thumbnailKind: 'teal-to-turquoise',
    minutesRead: 4,
    cityId: 'miami',
    ctaCityId: 'miami',
  },
  {
    id: 'news-09',
    category: 'team',
    title: 'Spain\'s Attacking Depth: Rotation Options in Group C',
    summary:
      'With multiple quality attacking options in their squad, Spain enter Group C with the flexibility to rotate and still maintain a sharp pressing game. Matchday26 Editorial breaks it down.',
    source: 'Matchday26 Editorial',
    publishedIso: '2026-05-31T15:30:00Z',
    thumbnailKind: 'coral-to-gold',
    minutesRead: 5,
    teamName: 'Spain',
    ctaCityId: 'los-angeles',
  },
  {
    id: 'news-10',
    category: 'player',
    title: 'Goalkeepers Who Could Steal the Show',
    summary:
      'A stellar save can swing a knockout tie. Matchday26 Editorial profiles four keepers with the temperament and shot-stopping ability to become unlikely heroes this summer.',
    source: 'Matchday26 Editorial',
    publishedIso: '2026-05-30T10:00:00Z',
    thumbnailKind: 'grape-to-turquoise',
    minutesRead: 6,
  },
  {
    id: 'news-11',
    category: 'city',
    title: 'Seattle: Lumen Field\'s Link Light Rail Is the Easiest Ride in the Tournament',
    summary:
      'Link Light Rail runs directly from Sea-Tac Airport to Stadium Station outside Lumen Field. Frequency, fares, and accessibility features — all you need to know.',
    source: 'Matchday26',
    publishedIso: '2026-05-29T12:00:00Z',
    thumbnailKind: 'turquoise-to-grape',
    minutesRead: 3,
    cityId: 'seattle',
    ctaCityId: 'seattle',
  },
  {
    id: 'news-12',
    category: 'video',
    title: 'Canada\'s Home Opener at BMO Field: Toronto Prepares',
    summary:
      'Toronto is set to host Canada\'s first match in front of a home crowd. A short look at the venue setup, fan areas, and TTC connections on match day.',
    source: 'Matchday26',
    publishedIso: '2026-05-28T11:00:00Z',
    thumbnailKind: 'gold-to-coral',
    videoSeconds: 192,
    cityId: 'toronto',
    ctaCityId: 'toronto',
    teamName: 'Canada',
  },
];

export const PLAYER_SPOTLIGHTS: PlayerSpotlight[] = [
  {
    id: 'spot-01',
    name: 'Lucas Mendes',
    teamName: 'Brazil',
    position: 'Central Midfielder',
    nationality: 'Brazil',
    capsOrApps: 42,
    description:
      'A composed deep-lying playmaker known for his range of passing and ability to break up attacks before they develop. Illustrative sample profile from Matchday26 Editorial.',
    thumbnailKind: 'coral-to-gold',
  },
  {
    id: 'spot-02',
    name: 'Elena Vargas',
    teamName: 'Spain',
    position: 'Attacking Midfielder',
    nationality: 'Spain',
    capsOrApps: 31,
    description:
      'Quick between the lines with a deft first touch, she orchestrates Spain\'s transitions from deep. Illustrative sample profile from Matchday26 Editorial.',
    thumbnailKind: 'grape-to-turquoise',
  },
  {
    id: 'spot-03',
    name: 'Kofi Asante',
    teamName: 'Ghana',
    position: 'Right Winger',
    nationality: 'Ghana',
    capsOrApps: 27,
    description:
      'Explosive pace and a direct style make him Ghana\'s most dangerous wide outlet. His crossing accuracy from the byline has improved significantly. Illustrative sample profile from Matchday26 Editorial.',
    thumbnailKind: 'teal-to-turquoise',
  },
];

export const TEAM_BRIEFS: TeamBrief[] = [
  {
    id: 'tb-brazil',
    name: 'Brazil',
    confederation: 'CONMEBOL',
    groupId: 'B',
    wins: 4,
    draws: 1,
    losses: 0,
    blurb: 'Fluid attacking play and high defensive line; unbeaten in qualifying.',
  },
  {
    id: 'tb-france',
    name: 'France',
    confederation: 'UEFA',
    groupId: 'C',
    wins: 3,
    draws: 2,
    losses: 0,
    blurb: 'Defensive solidity underpins a potent counter-attacking threat.',
  },
  {
    id: 'tb-spain',
    name: 'Spain',
    confederation: 'UEFA',
    groupId: 'F',
    wins: 4,
    draws: 1,
    losses: 0,
    blurb: 'Possession-based pressing game with exceptional midfield depth.',
  },
  {
    id: 'tb-argentina',
    name: 'Argentina',
    confederation: 'CONMEBOL',
    groupId: 'A',
    wins: 5,
    draws: 0,
    losses: 0,
    blurb: 'Reigning champions arrive with a settled squad and tournament experience.',
  },
  {
    id: 'tb-germany',
    name: 'Germany',
    confederation: 'UEFA',
    groupId: 'H',
    wins: 3,
    draws: 1,
    losses: 1,
    blurb: 'Young core blending with experience; hungry after recent tournament exits.',
  },
  {
    id: 'tb-england',
    name: 'England',
    confederation: 'UEFA',
    groupId: 'E',
    wins: 4,
    draws: 1,
    losses: 0,
    blurb: 'Strong squad depth with a reliable goalkeeper and clinical forward line.',
  },
];
