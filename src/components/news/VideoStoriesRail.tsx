'use client';

import type { NewsItem } from '@/types/news';
import { VideoStoryCard } from './VideoStoryCard';

interface VideoStoriesRailProps {
  items: NewsItem[];
}

export const VideoStoriesRail = ({ items }: VideoStoriesRailProps) => {
  if (items.length === 0) return null;

  return (
    <section aria-label="Video stories">
      <h2 className="text-[#0c1116] text-xl font-bold mb-3 tracking-tight">Videos</h2>
      <div
        className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory motion-reduce:scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
        aria-label="Scroll to see more videos"
      >
        {items.map((item) => (
          <div key={item.id} className="snap-start shrink-0">
            <VideoStoryCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
};
