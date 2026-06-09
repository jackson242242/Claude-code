'use client';

import type { TeamBrief } from '@/types/news';
import { getFlag } from '@/lib/flags';

interface TeamBriefCardProps {
  team: TeamBrief;
}

export const TeamBriefCard = ({ team }: TeamBriefCardProps) => {
  const flag = getFlag(team.name);

  return (
    <article className="flex flex-col gap-3 bg-[#ffffff] rounded-[1.125rem] shadow-[0_6px_24px_rgba(13,22,33,0.08)] p-4 transition-transform duration-150 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">
          {flag || '🏳️'}
        </span>
        <div>
          <p className="text-[#0c1116] font-bold text-base m-0 leading-tight">{team.name}</p>
          <p className="text-[#646e7a] text-xs m-0">
            Group {team.groupId} · {team.confederation}
          </p>
        </div>
        {/* Grape badge for team category */}
        <span className="ml-auto text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7c5cff] text-white shrink-0">
          Team
        </span>
      </div>

      {/* W/D/L mini record */}
      <div className="flex gap-3" role="list" aria-label="Recent form">
        <div className="flex flex-col items-center" role="listitem">
          <span className="text-lg font-bold text-[#7fb800] leading-none">{team.wins}</span>
          <span className="text-[0.65rem] uppercase tracking-wider text-[#646e7a] font-semibold">W</span>
        </div>
        <div className="flex flex-col items-center" role="listitem">
          <span className="text-lg font-bold text-[#646e7a] leading-none">{team.draws}</span>
          <span className="text-[0.65rem] uppercase tracking-wider text-[#646e7a] font-semibold">D</span>
        </div>
        <div className="flex flex-col items-center" role="listitem">
          <span className="text-lg font-bold text-[#ff5d52] leading-none">{team.losses}</span>
          <span className="text-[0.65rem] uppercase tracking-wider text-[#646e7a] font-semibold">L</span>
        </div>
      </div>

      <p className="text-[#646e7a] text-sm leading-relaxed m-0">{team.blurb}</p>
    </article>
  );
};
