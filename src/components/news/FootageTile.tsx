'use client';

import type { TouristVideo, ThumbnailKind } from '@/types/touristVideo';

/* ------------------------------------------------------------------ */
/* Gradient map — same four kinds defined in ThumbnailKind             */
/* ------------------------------------------------------------------ */
const GRADIENT_MAP: Record<ThumbnailKind, string> = {
  'teal-to-turquoise': 'from-[#0a8f84] to-[#11b3c6]',
  'grape-to-turquoise': 'from-[#7c5cff] to-[#11b3c6]',
  'coral-to-gold': 'from-[#ff5d52] to-[#e0a82e]',
  'citrus-to-teal': 'from-[#7fb800] to-[#0a8f84]',
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

interface FootageTileProps {
  video: TouristVideo;
  onOpen: (video: TouristVideo) => void;
}

export const FootageTile = ({ video, onOpen }: FootageTileProps) => {
  const gradient = GRADIENT_MAP[video.thumbnailKind];
  const duration = formatDuration(video.durationSeconds);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(video);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Watch: ${video.title}`}
      onClick={() => onOpen(video)}
      onKeyDown={handleKeyDown}
      className="relative w-full overflow-hidden rounded-[1.125rem] shadow-[0_6px_24px_rgba(13,22,33,0.08)] cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#0fb5a6] focus-visible:outline-offset-2 group"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Poster image if available, else gradient placeholder */}
      {video.posterUrl != null ? (
        <img
          src={video.posterUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
          aria-hidden="true"
        />
      )}

      {/* Dark scrim for text legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
        aria-hidden="true"
      />

      {/* Hover/focus tint — motion-reduce: skip the opacity transition */}
      <div
        className="absolute inset-0 bg-black/0 group-hover:bg-black/10 group-focus-visible:bg-black/10 transition-colors duration-150 motion-reduce:transition-none"
        aria-hidden="true"
      />

      {/* Centered play affordance */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:scale-110 group-focus-visible:scale-110 transition-transform duration-150 motion-reduce:transition-none motion-reduce:scale-100">
          {/* Triangle play icon */}
          <div
            className="ml-1"
            style={{
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '14px solid #0a8f84',
            }}
          />
        </div>
      </div>

      {/* Muted badge — top right */}
      <div className="absolute top-2 right-2" aria-hidden="true">
        <span className="bg-black/60 text-white text-[0.6rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded">
          Muted
        </span>
      </div>

      {/* Bottom overlay: duration + title */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-3 flex flex-col gap-1">
        <span className="text-white text-[0.65rem] font-semibold tabular-nums">
          {duration}
        </span>
        <p className="text-white text-[0.7rem] leading-tight line-clamp-2 m-0 font-medium">
          {video.title}
        </p>
      </div>
    </div>
  );
};
