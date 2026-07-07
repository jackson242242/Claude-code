import Link from 'next/link';
import { getCities, getMatches } from '@/services/scheduleService';
import { CityCard } from '@/components/CityCard';
import { getLocale } from '@/i18n/server';
import { translator } from '@/i18n';
import {
  getTouristVideos,
  getHeroVideos,
} from '@/services/touristVideosService';
import { getLiveNews } from '@/services/newsService';
import { SUPERSTAR_VIDEOS } from '@/mocks/superstars';
import { BLOOPER_VIDEOS } from '@/mocks/bloopers';
import { HomeNewsWindow } from '@/components/news/HomeNewsWindow';
import { HeroVideoBackground } from '@/components/HeroVideoBackground';
import { HeroLiveStrip } from '@/components/HeroLiveStrip';

/** Kickoff: 2026 World Cup opening match, June 11 2026. */
const KICKOFF_UTC = Date.UTC(2026, 5, 11);
/** Day after the July 19 2026 final — the LIVE strip retires after this. */
const TOURNAMENT_END_UTC = Date.UTC(2026, 6, 20);

const HomePage = async () => {
  const locale = await getLocale();
  const now = Date.now();
  const tournamentLive = now >= KICKOFF_UTC && now < TOURNAMENT_END_UTC;
  const [cities, fanFootage, heroVideos, liveNews, todayMatches] =
    await Promise.all([
      getCities(),
      getTouristVideos(),
      getHeroVideos(),
      getLiveNews(locale),
      tournamentLive
        ? getMatches({ date: new Date(now).toISOString().slice(0, 10) })
        : Promise.resolve([]),
    ]);
  const t = translator(locale);
  // Top live headlines for the "Latest" rail (falls back to the curated seed
  // when the feed is unreachable).
  const videoStories = liveNews.items.slice(0, 10);
  const daysUntilKickoff = Math.max(
    0,
    Math.ceil((KICKOFF_UTC - now) / 86_400_000),
  );

  const hasHeroVideo = heroVideos.length > 0;

  return (
    <div className="home">
      <section className={hasHeroVideo ? 'hero hero--media' : 'hero'}>
        {hasHeroVideo && <HeroVideoBackground videos={heroVideos} />}
        {daysUntilKickoff > 0 ? (
          <div
            className="hero__countdown"
            aria-label={`${daysUntilKickoff} days until kickoff`}
          >
            {daysUntilKickoff} {daysUntilKickoff === 1 ? 'DAY' : 'DAYS'}
            <small>until kickoff · June 11</small>
          </div>
        ) : (
          tournamentLive && <HeroLiveStrip matches={todayMatches} now={now} />
        )}
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
        <div className="hero__actions">
          <Link className="btn" href="/schedule">
            {t('home.exploreSchedule')}
          </Link>
          <Link className="btn btn--ghost" href="/hotels">
            {t('home.findHotels')}
          </Link>
        </div>
        <div className="hero__trust">
          <span>
            <strong>104</strong> matches
          </span>
          <span>
            <strong>{cities.length}</strong> host cities
          </span>
          <span>
            <strong>3</strong> countries
          </span>
        </div>
      </section>

      <HomeNewsWindow
        superstars={SUPERSTAR_VIDEOS}
        bloopers={BLOOPER_VIDEOS}
        videoStories={videoStories}
        fanFootage={fanFootage}
      />

      <section>
        <h2>{t('home.hostCities')}</h2>
        <div className="city-grid">
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </section>

      <section>
        <h2>Plan your trip</h2>
        <div className="plan-grid">
          <Link className="plan-tile plan-tile--flights" href="/flights">
            <span className="plan-tile__label">{t('nav.flights')} →</span>
            <span className="plan-tile__sub">
              Search fares to every host city
            </span>
          </Link>
          <Link className="plan-tile plan-tile--hotels" href="/hotels">
            <span className="plan-tile__label">{t('nav.hotels')} →</span>
            <span className="plan-tile__sub">Stay near the stadiums</span>
          </Link>
          <Link className="plan-tile plan-tile--transport" href="/transport">
            <span className="plan-tile__label">{t('nav.transport')} →</span>
            <span className="plan-tile__sub">
              Get between cities and venues
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
