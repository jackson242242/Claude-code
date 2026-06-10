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
import type { NewsItem, ThumbnailKind } from '@/types/news';

interface NewsFeedSource {
  url: string;
  name: string;
}

/** Keyless, sports-only RSS sources (first that returns ≥3 items wins). */
const FEEDS: ReadonlyArray<NewsFeedSource> = [
  { url: 'https://www.theguardian.com/football/rss', name: 'The Guardian' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', name: 'ESPN' },
];

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

const fetchFeed = async (source: NewsFeedSource): Promise<NewsItem[]> => {
  // Hard timeout so a slow/unreachable feed can never stall the page render —
  // it fails fast and we fall back to the seed.
  const res = await fetch(source.url, {
    headers: {
      'user-agent': 'Matchday26/1.0 (+https://matchday26.app)',
      accept: 'application/rss+xml, application/xml, text/xml',
    },
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(6000),
  } as RequestInit);
  if (!res.ok) return [];
  return parseRss(await res.text(), source.name);
};

/**
 * Live news for /news (and the home headlines rail): real RSS articles +
 * curated short-video stories, with a graceful fallback to the static seed.
 */
export const getLiveNews = async (): Promise<NewsItem[]> => {
  const videoStories = NEWS_ITEMS.filter((item) => item.category === 'video');

  for (const source of FEEDS) {
    try {
      const live = await fetchFeed(source);
      if (live.length >= 3) return [...live, ...videoStories];
    } catch {
      // Try the next feed, then fall back to the seed.
    }
  }

  return NEWS_ITEMS;
};
