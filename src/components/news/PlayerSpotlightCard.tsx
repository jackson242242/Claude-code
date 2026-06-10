'use client';

import type { PlayerSpotlight, ThumbnailKind } from '@/types/news';
import { getFlag } from '@/lib/flags';

const GRADIENT_MAP: Record<ThumbnailKind, string> = {
  'teal-to-turquoise': 'from-[#3d8bff] to-[#2f6fe0]',
  'coral-to-gold': 'from-[#ff5d52] to-[#e0a82e]',
  'grape-to-turquoise': 'from-[#7c5cff] to-[#2f6fe0]',
  'citrus-to-teal': 'from-[#7fb800] to-[#3d8bff]',
  'gold-to-coral': 'from-[#e0a82e] to-[#ff5d52]',
  'turquoise-to-grape': 'from-[#2f6fe0] to-[#7c5cff]',
};

interface PlayerSpotlightCardProps {
  player: PlayerSpotlight;
}

export const PlayerSpotlightCard = ({ player }: PlayerSpotlightCardProps) => {
  const gradient = GRADIENT_MAP[player.thumbnailKind];
  const flag = getFlag(player.nationality);

  return (
    <article className="flex gap-4 bg-[#141d2b] rounded-[1.125rem] shadow-[0_6px_24px_rgba(0,0,0,0.45)] p-4 transition-transform duration-150 hover:-translate-y-0.5">
      {/* Avatar stand-in */}
      <div
        className={`shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl`}
        aria-hidden="true"
      >
        {flag || '⚽'}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Grape = team/player category */}
          <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7c5cff] text-white">
            Player
          </span>
          <span className="text-[#8a97a8] text-xs">{player.teamName}</span>
        </div>
        <p className="text-[#f3f6fa] font-bold text-base m-0">{player.name}</p>
        <p className="text-[#8a97a8] text-xs m-0">
          {player.position} · {player.capsOrApps} caps
        </p>
        <p className="text-[#f3f6fa] text-sm leading-relaxed m-0 line-clamp-3">
          {player.description}
        </p>
      </div>
    </article>
  );
};
