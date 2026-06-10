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

const CATEGORY_BADGE: Record<NewsItem['category'], { label: string; className: string }> = {
  team: { label: 'Team', className: 'bg-[#7c5cff] text-white' },
  player: { label: 'Player', className: 'bg-[#7c5cff] text-white' },
  schedule: { label: 'Schedule', className: 'bg-[#3d8bff] text-white' },
  city: { label: 'City', className: 'bg-[#2f6fe0] text-white' },
  video: { label: 'Video', className: 'bg-[#2f6fe0] text-white' },
};

const formatRelativeDate = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

interface NewsCardProps {
  item: NewsItem;
  variant?: 'grid' | 'list';
}

export const NewsCard = ({ item, variant = 'grid' }: NewsCardProps) => {
  const gradient = GRADIENT_MAP[item.thumbnailKind];
  const badge = CATEGORY_BADGE[item.category];

  if (variant === 'list') {
    return (
      <article className="flex gap-4 bg-[#141d2b] rounded-[1.125rem] shadow-[0_6px_24px_rgba(0,0,0,0.45)] p-4 transition-transform duration-150 hover:-translate-y-0.5 focus-within:-translate-y-0.5">
        {/* Thumbnail */}
        <div
          className={`shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br ${gradient}`}
          aria-hidden="true"
        />
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.className}`}
            >
              {badge.label}
            </span>
            <span className="text-[#8a97a8] text-xs">{formatRelativeDate(item.publishedIso)}</span>
          </div>
          <p className="text-[#f3f6fa] font-semibold text-sm leading-snug line-clamp-2 m-0">
            {item.title}
          </p>
          <p className="text-[#8a97a8] text-xs m-0">
            {item.source}
            {item.minutesRead != null && ` · ${item.minutesRead} min read`}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col bg-[#141d2b] rounded-[1.125rem] shadow-[0_6px_24px_rgba(0,0,0,0.45)] overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 focus-within:-translate-y-0.5">
      {/* Thumbnail */}
      <div
        className={`h-36 bg-gradient-to-br ${gradient} shrink-0`}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-block text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-[#8a97a8] text-xs">{formatRelativeDate(item.publishedIso)}</span>
        </div>
        <h3 className="text-[#f3f6fa] font-semibold text-base leading-snug m-0 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-[#8a97a8] text-sm leading-relaxed m-0 line-clamp-3 flex-1">
          {item.summary}
        </p>
        <p className="text-[#8a97a8] text-xs m-0 mt-auto">
          {item.source}
          {item.minutesRead != null && ` · ${item.minutesRead} min read`}
        </p>
      </div>
    </article>
  );
};
