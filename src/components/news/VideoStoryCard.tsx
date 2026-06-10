'use client';

import type { NewsItem, ThumbnailKind } from '@/types/news';

const GRADIENT_MAP: Record<ThumbnailKind, string> = {
  'teal-to-turquoise': 'from-[#3d8bff] to-[#2f6fe0]',
  'coral-to-gold': 'from-[#ff5d52] to-[#e0a82e]',
  'grape-to-turquoise': 'from-[#7c5cff] to-[#2f6fe0]',
  'citrus-to-teal': 'from-[#7fb800] to-[#3d8bff]',
  'gold-to-coral': 'from-[#e0a82e] to-[#ff5d52]',
  'turquoise-to-grape': 'from-[#2f6fe0] to-[#7c5cff]',
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

interface VideoStoryCardProps {
  item: NewsItem;
  /** 'md' enlarges the card for prominent placements (e.g. the home window). */
  size?: 'sm' | 'md';
}

export const VideoStoryCard = ({ item, size = 'sm' }: VideoStoryCardProps) => {
  const gradient = GRADIENT_MAP[item.thumbnailKind];
  const duration = item.videoSeconds != null ? formatDuration(item.videoSeconds) : null;
  const widthClass = size === 'md' ? 'w-[164px]' : 'w-[120px]';
  const playClass = size === 'md' ? 'w-14 h-14' : 'w-10 h-10';
  // Live items link out to the source article; curated stories go to /news
  // (never a dead in-page anchor).
  const external = item.url != null;
  const href = item.url ?? '/news';

  return (
    /* 9:16 card — fixed width, let height be determined by aspect ratio */
    <a
      href={href}
      {...(external
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
      aria-label={`Watch: ${item.title}`}
      className={`relative flex-shrink-0 ${widthClass} rounded-[1.125rem] overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.45)] focus-visible:outline-2 focus-visible:outline-[#5a9dff] focus-visible:outline-offset-2 block`}
      style={{ aspectRatio: '9/16' }}
    >
      {/* Gradient thumbnail stand-in */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
        aria-hidden="true"
      />

      {/* Dark scrim at bottom for text legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
        aria-hidden="true"
      />

      {/* Play button */}
      <div
        className="absolute inset-0 flex items-center justify-center motion-reduce:transition-none transition-transform duration-150"
        aria-hidden="true"
      >
        <div className={`${playClass} rounded-full bg-white/90 flex items-center justify-center shadow-md`}>
          {/* Triangle play icon using borders */}
          <div
            className="ml-1"
            style={{
              width: 0,
              height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderLeft: '12px solid #3d8bff',
            }}
          />
        </div>
      </div>

      {/* Muted badge */}
      <div className="absolute top-2 right-2" aria-hidden="true">
        <span className="bg-black/60 text-white text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded">
          Muted
        </span>
      </div>

      {/* Duration + progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 flex flex-col gap-1">
        {duration != null && (
          <span className="text-white text-[0.65rem] font-semibold">{duration}</span>
        )}
        {/* Static progress bar (no real video) */}
        <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5a9dff] rounded-full"
            style={{ width: '0%' }}
            role="progressbar"
            aria-label="Video progress"
            aria-valuenow={0}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="text-white text-[0.6rem] leading-tight line-clamp-2 m-0">
          {item.title}
        </p>
      </div>
    </a>
  );
};
