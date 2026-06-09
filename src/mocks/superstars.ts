/**
 * Superstar video links — different-nation stars for the home "Matchday News"
 * window.
 *
 * HONESTY / RIGHTS: actual match footage of these players is owned by
 * FIFA/clubs/broadcasters, so we do NOT host or embed it. Each card is an
 * EXTERNAL LINK that opens a YouTube search for the player's highlights in a
 * new tab — license-safe (a link/search, not hosted content) and always
 * watchable, with no API key required. Sports content only.
 */

import type { ThumbnailKind } from '@/types/touristVideo';

export interface SuperstarVideo {
  id: string;
  name: string;
  nation: string;
  /** Country flag emoji. */
  flag: string;
  /** Short vibe label, e.g. "Goals & skills". */
  blurb: string;
  /** External watch link (opens in a new tab). */
  watchUrl: string;
  thumbnailKind: ThumbnailKind;
}

const youtube = (query: string): string =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

export const SUPERSTAR_VIDEOS: SuperstarVideo[] = [
  {
    id: 'ss-ronaldo',
    name: 'Cristiano Ronaldo',
    nation: 'Portugal',
    flag: '🇵🇹',
    blurb: 'Goals & skills',
    watchUrl: youtube('Cristiano Ronaldo skills and goals'),
    thumbnailKind: 'coral-to-gold',
  },
  {
    id: 'ss-mbappe',
    name: 'Kylian Mbappé',
    nation: 'France',
    flag: '🇫🇷',
    blurb: 'Pace & finishing',
    watchUrl: youtube('Kylian Mbappe skills and goals'),
    thumbnailKind: 'grape-to-turquoise',
  },
  {
    id: 'ss-messi',
    name: 'Lionel Messi',
    nation: 'Argentina',
    flag: '🇦🇷',
    blurb: 'Magic & assists',
    watchUrl: youtube('Lionel Messi skills and goals'),
    thumbnailKind: 'teal-to-turquoise',
  },
  {
    id: 'ss-vinicius',
    name: 'Vinícius Júnior',
    nation: 'Brazil',
    flag: '🇧🇷',
    blurb: 'Dribbles & goals',
    watchUrl: youtube('Vinicius Junior skills and goals'),
    thumbnailKind: 'citrus-to-teal',
  },
  {
    id: 'ss-haaland',
    name: 'Erling Haaland',
    nation: 'Norway',
    flag: '🇳🇴',
    blurb: 'Power & goals',
    watchUrl: youtube('Erling Haaland skills and goals'),
    thumbnailKind: 'grape-to-turquoise',
  },
  {
    id: 'ss-pulisic',
    name: 'Christian Pulisic',
    nation: 'USA',
    flag: '🇺🇸',
    blurb: 'Host-nation star',
    watchUrl: youtube('Christian Pulisic skills and goals'),
    thumbnailKind: 'coral-to-gold',
  },
  {
    id: 'ss-davies',
    name: 'Alphonso Davies',
    nation: 'Canada',
    flag: '🇨🇦',
    blurb: 'Flying fullback',
    watchUrl: youtube('Alphonso Davies skills and goals'),
    thumbnailKind: 'teal-to-turquoise',
  },
  {
    id: 'ss-gimenez',
    name: 'Santiago Giménez',
    nation: 'Mexico',
    flag: '🇲🇽',
    blurb: 'Clinical striker',
    watchUrl: youtube('Santiago Gimenez skills and goals'),
    thumbnailKind: 'citrus-to-teal',
  },
];
