/**
 * Live news service — Stories & News pillar.
 *
 * Pulls current football headlines from a keyless public RSS feed at request
 * time (RSC, revalidated hourly) and maps them onto our NewsItem shape, then
 * appends the curated short-video stories so the video rail stays populated.
 * Falls back to the static seed (src/mocks/news.ts) on any error or empty feed,
 * so /news always renders real-looking content.
 *
 * NOTE: outbound fetch is exercised on the deployed environment (Render web
 * services have open egress). The sandbox's allow-list blocks the feed host, so
 * locally this returns the seed — that's the honest fallback, not a failure.
 * The pure parser (parseRss) is unit-tested against a realistic RSS sample.
 */

import { NEWS_ITEMS } from '@/mocks/news';
import { DEFAULT_LOCALE, type Locale } from '@/i18n';
import type { NewsItem, ThumbnailKind } from '@/types/news';

interface NewsFeedSource {
  url: string;
  name: string;
}

/** Keyless, football-only RSS sources. English doubles as the universal fallback. */
const EN_FEEDS: ReadonlyArray<NewsFeedSource> = [
  { url: 'https://www.theguardian.com/football/rss', name: 'The Guardian' },
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', name: 'BBC Sport' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', name: 'ESPN' },
];

/** Locale-specific feeds, tried before the English fallback. */
const FEEDS_BY_LOCALE: Record<Locale, ReadonlyArray<NewsFeedSource>> = {
  en: EN_FEEDS,
  es: [
    { url: 'https://e00-marca.uecdn.es/rss/futbol/mundial.xml', name: 'Marca' },
    { url: 'https://as.com/rss/futbol/portada.xml', name: 'AS' },
  ],
  fr: [
    {
      url: 'https://www.lequipe.fr/rss/actu_rss_Football.xml',
      name: "L'Équipe",
    },
  ],
};

/** Result of a live-news lookup: the items + whether they came from a feed. */
export interface LiveNews {
  items: NewsItem[];
  /** True when a real RSS feed answered (drives the "Live" pill). */
  live: boolean;
  /** Name of the feed that answered, or null on the seed fallback. */
  source: string | null;
}

const THUMBNAILS: ThumbnailKind[] = [
  'teal-to-turquoise',
  'grape-to-turquoise',
  'coral-to-gold',
  'citrus-to-teal',
  'gold-to-coral',
  'turquoise-to-grape',
];

const stripCdata = (value: string): string =>
  value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');

const decodeEntities = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const stripHtml = (value: string): string =>
  value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const pickTag = (block: string, tag: string): string => {
  const match = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'),
  );
  return match ? decodeEntities(stripCdata(match[1].trim())).trim() : '';
};

/** Stable FNV-1a id from a string (so the same article keeps the same id). */
const hashId = (seed: string): string => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const toIso = (pubDate: string): string => {
  const time = Date.parse(pubDate);
  return Number.isNaN(time)
    ? new Date().toISOString()
    : new Date(time).toISOString();
};

/**
 * Parse an RSS 2.0 document into NewsItems. Pure + deterministic (no network),
 * so it can be unit-tested against a sample feed.
 */
export const parseRss = (
  xml: string,
  sourceName: string,
  max = 12,
): NewsItem[] => {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const items: NewsItem[] = [];

  for (const block of blocks) {
    const title = pickTag(block, 'title');
    const link = pickTag(block, 'link');
    if (title.length === 0 || link.length === 0) continue;

    const summary = stripHtml(pickTag(block, 'description')).slice(0, 180);
    const index = items.length;
    items.push({
      id: `live-${hashId(link)}`,
      category: 'team',
      title,
      summary: summary.length > 0 ? summary : title,
      source: sourceName,
      publishedIso: toIso(pickTag(block, 'pubDate')),
      thumbnailKind: THUMBNAILS[index % THUMBNAILS.length],
      url: link,
      minutesRead: Math.max(1, Math.round((summary.length || 80) / 200)),
    });

    if (items.length >= max) break;
  }

  return items;
};

/** Hard timeout (where supported) so a slow feed can never stall a render. */
const timeoutSignal = (ms: number): AbortSignal | undefined =>
  typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(ms)
    : undefined;

const fetchFeed = async (source: NewsFeedSource): Promise<NewsItem[]> => {
  const res = await fetch(source.url, {
    headers: {
      'user-agent': 'Matchday26/1.0 (+https://matchday26.app)',
      accept: 'application/rss+xml, application/xml, text/xml',
    },
    next: { revalidate: 1800 },
    signal: timeoutSignal(6000),
  } as RequestInit);
  if (!res.ok) return [];
  return parseRss(await res.text(), source.name);
};

/**
 * Live news for /news (and the home headlines rail): real RSS articles +
 * curated short-video stories, with a graceful fallback to the static seed.
 * Tries the locale's feeds first, then English, then the seed.
 */
export const getLiveNews = async (
  locale: Locale = DEFAULT_LOCALE,
): Promise<LiveNews> => {
  const videoStories = NEWS_ITEMS.filter((item) => item.category === 'video');

  // Locale feeds first, then English fallback — de-duplicated by URL.
  const seen = new Set<string>();
  const ordered = [...(FEEDS_BY_LOCALE[locale] ?? []), ...EN_FEEDS].filter(
    (source) => (seen.has(source.url) ? false : seen.add(source.url)),
  );

  for (const source of ordered) {
    try {
      const live = await fetchFeed(source);
      if (live.length >= 3) {
        return {
          items: [...live, ...videoStories],
          live: true,
          source: source.name,
        };
      }
    } catch {
      // Try the next feed, then fall back to the seed.
    }
  }

  return { items: NEWS_ITEMS, live: false, source: null };
};
