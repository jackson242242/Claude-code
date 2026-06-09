'use client';

/**
 * HomeNewsWindow — the home-page "Matchday News" short-video window.
 *
 * A thin, tabbed wrapper over the existing news/video module (no new data
 * layer): one rail of national-team video stories (VideoStoryCard ← NewsItem)
 * and one rail of fan footage (FootageTile + VideoLightbox ← TouristVideo,
 * served by getTouristVideos(): Pexels → JSON cache → seed). Thumbnails never
 * autoplay — tapping a fan clip opens the muted/looped lightbox. Honest by
 * design: gradient placeholders stand in until a real Pexels key is wired.
 */

import { useState } from 'react';
import Link from 'next/link';
import type { NewsItem } from '@/types/news';
import type { TouristVideo } from '@/types/touristVideo';
import { VideoStoryCard } from './VideoStoryCard';
import { FootageTile } from './FootageTile';
import { VideoLightbox } from './VideoLightbox';

type TabId = 'teams' | 'fans';

const RAIL_CLASS =
  'flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x motion-reduce:scroll-auto';

const tabClass = (active: boolean): string =>
  [
    'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0fb5a6] motion-reduce:transition-none',
    active
      ? 'bg-[#0a8f84] text-white shadow-sm'
      : 'bg-white text-[#5a6472] border border-[#e3e7ec] hover:bg-[#eceff3] hover:text-[#0b0f14]',
  ].join(' ');

interface HomeNewsWindowProps {
  /** National-team video stories (NEWS_ITEMS where category === 'video'). */
  videoStories: NewsItem[];
  /** Fan footage from getTouristVideos() (Pexels → cache → seed). */
  fanFootage: TouristVideo[];
}

export const HomeNewsWindow = ({
  videoStories,
  fanFootage,
}: HomeNewsWindowProps) => {
  const hasTeams = videoStories.length > 0;
  const hasFans = fanFootage.length > 0;
  const [tab, setTab] = useState<TabId>(hasTeams ? 'teams' : 'fans');
  const [selected, setSelected] = useState<TouristVideo | null>(null);

  // Nothing to show — don't render an empty shell.
  if (!hasTeams && !hasFans) return null;

  return (
    <section
      aria-label="Matchday news videos"
      className="rounded-[1.5rem] border border-[#e3e7ec] bg-[#f4f6f8] p-5 sm:p-6"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-xl font-bold tracking-tight text-[#0b0f14]">
            <span aria-hidden="true" className="text-[#e60e7b]">
              ▶
            </span>
            Matchday News
          </h2>
          <p className="m-0 mt-1 text-sm text-[#5a6472]">
            Short clips from the national teams and the fan zone.
          </p>
        </div>
        <Link
          href="/news"
          className="shrink-0 text-sm font-semibold text-[#0a8f84] hover:text-[#0fb5a6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0fb5a6]"
        >
          View all →
        </Link>
      </div>

      {/* Tabs (only for streams that have content) */}
      <div role="tablist" aria-label="News stream" className="mb-4 flex gap-2">
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

      {/* National-team video stories */}
      {tab === 'teams' && hasTeams && (
        <div
          className={RAIL_CLASS}
          style={{ scrollbarWidth: 'none' }}
          aria-label="National team videos — scroll for more"
        >
          {videoStories.map((item) => (
            <div key={item.id} className="shrink-0 snap-start">
              <VideoStoryCard item={item} />
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
            <div key={video.id} className="w-[150px] shrink-0 snap-start">
              <FootageTile video={video} onOpen={setSelected} />
            </div>
          ))}
        </div>
      )}

      {/* Shared lightbox for fan footage */}
      {selected != null && (
        <VideoLightbox video={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
};
