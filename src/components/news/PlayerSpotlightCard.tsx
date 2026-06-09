'use client';

import type { PlayerSpotlight, ThumbnailKind } from '@/types/news';
import { getFlag } from '@/lib/flags';

const GRADIENT_MAP: Record<ThumbnailKind, string> = {
  'teal-to-turquoise': 'from-[#0a8f84] to-[#11b3c6]',
  'coral-to-gold': 'from-[#ff5d52] to-[#e0a82e]',
  'grape-to-turquoise': 'from-[#7c5cff] to-[#11b3c6]',
  'citrus-to-teal': 'from-[#7fb800] to-[#0a8f84]',
  'gold-to-coral': 'from-[#e0a82e] to-[#ff5d52]',
  'turquoise-to-grape': 'from-[#11b3c6] to-[#7c5cff]',
};

interface PlayerSpotlightCardProps {
  player: PlayerSpotlight;
}

export const PlayerSpotlightCard = ({ player }: PlayerSpotlightCardProps) => {
  const gradient = GRADIENT_MAP[player.thumbnailKind];
  const flag = getFlag(player.nationality);

  return (
    <article className="flex gap-4 bg-[#ffffff] rounded-[1.125rem] shadow-[0_6px_24px_rgba(13,22,33,0.08)] p-4 transition-transform duration-150 hover:-translate-y-0.5">
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
          <span className="text-[#646e7a] text-xs">{player.teamName}</span>
        </div>
        <p className="text-[#0c1116] font-bold text-base m-0">{player.name}</p>
        <p className="text-[#646e7a] text-xs m-0">
          {player.position} · {player.capsOrApps} caps
        </p>
        <p className="text-[#0c1116] text-sm leading-relaxed m-0 line-clamp-3">
          {player.description}
        </p>
      </div>
    </article>
  );
};
