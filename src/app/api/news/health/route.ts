/**
 * GET /api/news/health — live-news status probe (the "majordomo" check).
 *
 * Runs the live-news lookup server-side and reports whether a real RSS feed is
 * currently answering, which source, and how many live items came back —
 * without dumping the articles. Lets a 6-hour routine (or a browser / uptime
 * monitor) confirm in one request that World Cup news is flowing on production.
 * On the seed fallback it returns live:false. Optional ?locale=es|fr.
 */

import { NextResponse } from 'next/server';
import { getLiveNews } from '@/services/newsService';
import { DEFAULT_LOCALE, isLocale } from '@/i18n';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request): Promise<NextResponse> => {
  const requested = new URL(req.url).searchParams.get('locale');
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  const news = await getLiveNews(locale);
  // Count only genuinely-live items (feed-sourced, id-prefixed `live-`). Seed
  // fallback items also carry `url`, so counting by url would report a
  // non-zero liveCount even when live:false.
  const liveCount = news.live
    ? news.items.filter((item) => item.id.startsWith('live-')).length
    : 0;

  return NextResponse.json(
    {
      live: news.live,
      source: news.source,
      locale,
      liveCount,
      total: news.items.length,
      checkedAt: new Date().toISOString(),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
};
