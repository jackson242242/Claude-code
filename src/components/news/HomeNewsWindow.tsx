'use client';

/**
 * HomeNewsWindow — the home-page "Matchday News" short-video window.
 *
 * A bold "video theater" block with a tabbed rail of short videos. Four
 * streams, all reusing existing data/components (no new data layer):
 *   - Superstars: external YouTube links per different-nation star (always
 *     watchable, no API key, never blacks out) — SuperstarCard ← SUPERSTAR_VIDEOS.
 *   - Bloopers: external YouTube links to fails/funny compilations (eyeball
 *     bait) — SuperstarCard ← BLOOPER_VIDEOS.
 *   - National Teams: video stories (VideoStoryCard ← NewsItem) linking to /news.
 *   - Fan Zone: fan footage (FootageTile + VideoLightbox ← getTouristVideos()).
 * Thumbnails never autoplay; honest gradient placeholders until a key is wired.
 */

import { useState } from 'react';
import Link from 'next/link';
import type { NewsItem } from '@/types/news';
import type { TouristVideo } from '@/types/touristVideo';
import type { SuperstarVideo } from '@/mocks/superstars';
import { SuperstarCard } from './SuperstarCard';
import { VideoStoryCard } from './VideoStoryCard';
import { FootageTile } from './FootageTile';
import { VideoLightbox } from './VideoLightbox';

type TabId = 'stars' | 'bloopers' | 'teams' | 'fans';

const RAIL_CLASS = 'flex gap-4 overflow-x-auto pb-1 -mx-1 px-1 snap-x';

const tabClass = (active: boolean): string =>
  [
    'px-4 py-2 rounded-full text-sm font-bold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a9dff] motion-reduce:transition-none',
    active
      ? 'bg-[#3d8bff] text-white shadow-[0_6px_18px_rgba(61,139,255,0.35)]'
      : 'bg-[#1b2636] text-[#8a97a8] border border-[#243042] hover:bg-[#243042] hover:text-[#f3f6fa]',
  ].join(' ');

interface HomeNewsWindowProps {
  /** Different-nation superstar links (external YouTube). */
  superstars: SuperstarVideo[];
  /** National-team video stories (NEWS_ITEMS where category === 'video'). */
  videoStories: NewsItem[];
  /** Fan footage from getTouristVideos() (Pexels → cache → seed). */
  fanFootage: TouristVideo[];
  /** Bloopers / funny-moment links (external YouTube) — eyeball bait. */
  bloopers?: SuperstarVideo[];
}

export const HomeNewsWindow = ({
  superstars,
  videoStories,
  fanFootage,
  bloopers = [],
}: HomeNewsWindowProps) => {
  const hasStars = superstars.length > 0;
  const hasBloopers = bloopers.length > 0;
  const hasTeams = videoStories.length > 0;
  const hasFans = fanFootage.length > 0;

  const initialTab: TabId = hasStars
    ? 'stars'
    : hasBloopers
      ? 'bloopers'
      : hasTeams
        ? 'teams'
        : 'fans';
  const [tab, setTab] = useState<TabId>(initialTab);
  const [selected, setSelected] = useState<TouristVideo | null>(null);

  // Nothing to show — don't render an empty shell.
  if (!hasStars && !hasBloopers && !hasTeams && !hasFans) return null;

  return (
    <section
      aria-label="Matchday news videos"
      className="overflow-hidden rounded-[1.5rem] border border-[#243042] shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
    >
      {/* Dark "video theater" header band — pops against the light page */}
      <div
        className="relative flex items-center justify-between gap-3 px-5 py-5 text-white sm:px-7"
        style={{
          background:
            'linear-gradient(120deg, #0d1420 0%, #131f33 60%, #16263f 100%)',
        }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1"
          style={{ background: 'var(--gradient-festival)' }}
        />
        <div>
          <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-[#c9a55c]">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#3d8bff] opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3d8bff]" />
            </span>
            ▶ Watch
          </span>
          <h2 className="m-0 mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Matchday News
          </h2>
          <p className="m-0 mt-1 text-sm text-white/70">
            Superstars, bloopers, national teams and fan-zone clips — tap to
            watch.
          </p>
        </div>
        <Link
          href="/news"
          className="shrink-0 rounded-full bg-white/15 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          View all →
        </Link>
      </div>

      {/* Body */}
      <div className="bg-[#141d2b] px-5 py-5 sm:px-7">
        <div role="tablist" aria-label="News stream" className="mb-5 flex gap-2">
          {hasStars && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'stars'}
              onClick={() => setTab('stars')}
              className={tabClass(tab === 'stars')}
            >
              Superstars
            </button>
          )}
          {hasBloopers && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'bloopers'}
              onClick={() => setTab('bloopers')}
              className={tabClass(tab === 'bloopers')}
            >
              Bloopers 😂
            </button>
          )}
          {hasTeams && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'teams'}
              onClick={() => setTab('teams')}
              className={tabClass(tab === 'teams')}
            >
              National Teams
            </button>
          )}
          {hasFans && (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'fans'}
              onClick={() => setTab('fans')}
              className={tabClass(tab === 'fans')}
            >
              Fan Zone
            </button>
          )}
        </div>

        {/* Superstars — external watch links */}
        {tab === 'stars' && hasStars && (
          <div
            className={RAIL_CLASS}
            style={{ scrollbarWidth: 'none' }}
            aria-label="Superstar highlights — scroll for more"
          >
            {superstars.map((item) => (
              <div key={item.id} className="shrink-0 snap-start">
                <SuperstarCard item={item} />
              </div>
            ))}
          </div>
        )}

        {/* Bloopers — external watch links (eyeball bait) */}
        {tab === 'bloopers' && hasBloopers && (
          <div
            className={RAIL_CLASS}
            style={{ scrollbarWidth: 'none' }}
            aria-label="Soccer bloopers — scroll for more"
          >
            {bloopers.map((item) => (
              <div key={item.id} className="shrink-0 snap-start">
                <SuperstarCard item={item} />
              </div>
            ))}
          </div>
        )}

        {/* National-team video stories */}
        {tab === 'teams' && hasTeams && (
          <div
            className={RAIL_CLASS}
            style={{ scrollbarWidth: 'none' }}
            aria-label="National team videos — scroll for more"
          >
            {videoStories.map((item) => (
              <div key={item.id} className="shrink-0 snap-start">
                <VideoStoryCard item={item} size="md" />
              </div>
            ))}
          </div>
        )}

        {/* Fan footage */}
        {tab === 'fans' && hasFans && (
          <div
            className={RAIL_CLASS}
            style={{ scrollbarWidth: 'none' }}
            aria-label="Fan footage — scroll for more"
          >
            {fanFootage.map((video) => (
              <div key={video.id} className="w-[164px] shrink-0 snap-start">
                <FootageTile video={video} onOpen={setSelected} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared lightbox for fan footage */}
      {selected != null && (
        <VideoLightbox video={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
};
