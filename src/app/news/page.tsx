import type { Metadata } from 'next';
import { NEWS_ITEMS, PLAYER_SPOTLIGHTS, TEAM_BRIEFS } from '@/mocks/news';
import { NewsFeed } from '@/components/news/NewsFeed';

export const metadata: Metadata = {
  title: 'News · Matchday26 — World Cup 2026',
  description:
    'Match schedules, city travel guides, team news, player spotlights and video stories for the 2026 FIFA World Cup.',
};

const NewsPage = () => (
  /* Self-contained light wrapper — does not inherit the dark legacy body styles */
  <div className="min-h-screen bg-[#f6f7f9]">
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 pb-16">
      {/* Page header */}
      <header className="mb-8">
        <h1 className="text-[#0c1116] text-3xl sm:text-4xl font-bold tracking-tight leading-tight m-0">
          World Cup 2026 News
        </h1>
        <p className="text-[#646e7a] mt-2 text-base m-0">
          Match schedules, city guides, team stories and video highlights.
        </p>
      </header>

      <NewsFeed
        allItems={NEWS_ITEMS}
        spotlights={PLAYER_SPOTLIGHTS}
        teamBriefs={TEAM_BRIEFS}
      />
    </div>
  </div>
);

export default NewsPage;
