/**
 * Soccer bloopers — pure eyeball-bait stream for the home "Matchday News"
 * window.
 *
 * Same rights posture as the superstars: we do NOT host or embed clips —
 * every card is an EXTERNAL LINK opening a YouTube search in a new tab.
 * License-safe, always watchable, no API key. Reuses the SuperstarVideo
 * shape so the same card component renders both streams (name = clip theme,
 * nation = stream label, flag = emoji).
 */

import type { SuperstarVideo } from '@/mocks/superstars';

const youtube = (query: string): string =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

export const BLOOPER_VIDEOS: SuperstarVideo[] = [
  {
    id: 'bl-keeper-fails',
    name: 'Goalkeeper Fails',
    nation: 'Bloopers',
    flag: '🧤',
    blurb: 'Howlers & drops',
    watchUrl: youtube('funny goalkeeper fails compilation'),
    thumbnailKind: 'coral-to-gold',
  },
  {
    id: 'bl-open-goal',
    name: 'Open-Goal Misses',
    nation: 'Bloopers',
    flag: '😅',
    blurb: 'How did he miss?',
    watchUrl: youtube('funniest open goal misses football'),
    thumbnailKind: 'teal-to-turquoise',
  },
  {
    id: 'bl-own-goals',
    name: 'Comedy Own Goals',
    nation: 'Bloopers',
    flag: '🙈',
    blurb: 'Wrong net, sir',
    watchUrl: youtube('funny own goals compilation football'),
    thumbnailKind: 'grape-to-turquoise',
  },
  {
    id: 'bl-celebrations',
    name: 'Celebration Fails',
    nation: 'Bloopers',
    flag: '🤸',
    blurb: 'Backflips gone wrong',
    watchUrl: youtube('football celebration fails funny'),
    thumbnailKind: 'citrus-to-teal',
  },
  {
    id: 'bl-funny-moments',
    name: 'Funniest Moments',
    nation: 'Bloopers',
    flag: '😂',
    blurb: 'Refs, benches & chaos',
    watchUrl: youtube('funniest football moments compilation'),
    thumbnailKind: 'coral-to-gold',
  },
  {
    id: 'bl-mascots',
    name: 'Mascots & Pitch Chaos',
    nation: 'Bloopers',
    flag: '🦅',
    blurb: 'Uninvited guests',
    watchUrl: youtube('funny football mascot moments pitch invader animals'),
    thumbnailKind: 'grape-to-turquoise',
  },
];
