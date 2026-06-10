'use client';

import { useState } from 'react';
import type { NewsItem, PlayerSpotlight, TeamBrief } from '@/types/news';
import type { NewsCategory } from '@/types/news';
import { NewsCard } from './NewsCard';
import { VideoStoriesRail } from './VideoStoriesRail';
import { PlayerSpotlightCard } from './PlayerSpotlightCard';
import { TeamBriefCard } from './TeamBriefCard';
import { ConversionBridge } from './ConversionBridge';

type TabId = 'all' | 'videos' | 'teams' | 'players';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'videos', label: 'Videos' },
  { id: 'teams', label: 'Teams' },
  { id: 'players', label: 'Players' },
];

const TAB_CATEGORIES: Record<TabId, NewsCategory[] | null> = {
  all: null,
  videos: ['video'],
  teams: ['team'],
  players: ['player'],
};

interface NewsFeedProps {
  allItems: NewsItem[];
  spotlights: PlayerSpotlight[];
  teamBriefs: TeamBrief[];
}

export const NewsFeed = ({ allItems, spotlights, teamBriefs }: NewsFeedProps) => {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const allowedCategories = TAB_CATEGORIES[activeTab];
  const filteredItems = allowedCategories
    ? allItems.filter((item) => allowedCategories.includes(item.category))
    : allItems;

  const videoItems = allItems.filter((item) => item.category === 'video');

  // Pick a city-linked item to drive the ConversionBridge
  const bridgeItem = allItems.find((item) => item.ctaCityId != null);

  const showVideoRail = activeTab === 'all' || activeTab === 'videos';
  const showBridge = activeTab === 'all' && bridgeItem != null;
  const showSpotlights = activeTab === 'all' || activeTab === 'players';
  const showTeamBriefs = activeTab === 'all' || activeTab === 'teams';

  return (
    <div className="flex flex-col gap-10">
      {/* Category tabs */}
      <nav aria-label="News categories" className="flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={[
              'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a9dff] motion-reduce:transition-none',
              activeTab === tab.id
                ? 'bg-[#3d8bff] text-white shadow-sm'
                : 'bg-[#1b2636] text-[#8a97a8] hover:bg-[#243042] hover:text-[#f3f6fa]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Video Stories Rail */}
      {showVideoRail && videoItems.length > 0 && (
        <VideoStoriesRail items={videoItems} />
      )}

      {/* Top Stories grid */}
      {filteredItems.length > 0 && (
        <section aria-label="Top stories">
          <h2 className="text-[#f3f6fa] text-xl font-bold mb-4 tracking-tight">
            {activeTab === 'all'
              ? 'Top Stories'
              : activeTab === 'videos'
                ? 'Videos'
                : activeTab === 'teams'
                  ? 'Team News'
                  : 'Player News'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <NewsCard key={item.id} item={item} variant="grid" />
            ))}
          </div>
        </section>
      )}

      {filteredItems.length === 0 && (
        <p className="text-[#8a97a8] py-8">No stories in this category yet.</p>
      )}

      {/* Conversion Bridge */}
      {showBridge && bridgeItem != null && (
        <ConversionBridge item={bridgeItem} />
      )}

      {/* Player Spotlight */}
      {showSpotlights && spotlights.length > 0 && (
        <section aria-label="Player spotlights">
          <h2 className="text-[#f3f6fa] text-xl font-bold mb-4 tracking-tight">
            Player Spotlight
          </h2>
          <div className="flex flex-col gap-4">
            {spotlights.map((player) => (
              <PlayerSpotlightCard key={player.id} player={player} />
            ))}
          </div>
        </section>
      )}

      {/* Team Briefs */}
      {showTeamBriefs && teamBriefs.length > 0 && (
        <section aria-label="Team briefs">
          <h2 className="text-[#f3f6fa] text-xl font-bold mb-4 tracking-tight">
            Teams to Watch
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamBriefs.map((team) => (
              <TeamBriefCard key={team.id} team={team} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
