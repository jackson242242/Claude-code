import type { Metadata } from 'next';
import { PLAYER_SPOTLIGHTS, TEAM_BRIEFS } from '@/mocks/news';
import { NewsFeed } from '@/components/news/NewsFeed';
import { getLiveNews } from '@/services/newsService';
import { getTouristVideos } from '@/services/touristVideosService';
import { FanFootageWall } from '@/components/news/FanFootageWall';

export const metadata: Metadata = {
  title: 'News · Matchday26 — World Cup 2026',
  description:
    'Match schedules, city travel guides, team news, player spotlights and video stories for the 2026 FIFA World Cup.',
};

const NewsPage = async () => {
  const [footage, allItems] = await Promise.all([
    getTouristVideos(),
    getLiveNews(),
  ]);

  return (
    /* Self-contained light wrapper — does not inherit the dark legacy body styles */
    <div className="min-h-screen bg-[#0d1420]">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8 pb-16">
        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-[#f3f6fa] text-3xl sm:text-4xl font-bold tracking-tight leading-tight m-0">
            World Cup 2026 News
          </h1>
          <p className="text-[#8a97a8] mt-2 text-base m-0">
            Match schedules, city guides, team stories and video highlights.
          </p>
        </header>

        <div className="flex flex-col gap-10">
          {/* Fan footage wall — above the editorial feed */}
          {footage.length > 0 && (
            <FanFootageWall videos={footage} />
          )}

          <NewsFeed
            allItems={allItems}
            spotlights={PLAYER_SPOTLIGHTS}
            teamBriefs={TEAM_BRIEFS}
          />
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
