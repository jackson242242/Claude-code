import Link from 'next/link';
import { getCities } from '@/services/scheduleService';
import { CityCard } from '@/components/CityCard';
import { getLocale } from '@/i18n/server';
import { translator } from '@/i18n';

/** Kickoff: 2026 World Cup opening match, June 11 2026. */
const KICKOFF_UTC = Date.UTC(2026, 5, 11);

const HomePage = async () => {
  const [cities, locale] = await Promise.all([getCities(), getLocale()]);
  const t = translator(locale);
  const daysUntilKickoff = Math.max(
    0,
    Math.ceil((KICKOFF_UTC - Date.now()) / 86_400_000),
  );

  return (
    <div className="home">
      <section className="hero">
        {daysUntilKickoff > 0 && (
          <div
            className="hero__countdown"
            aria-label={`${daysUntilKickoff} days until kickoff`}
          >
            {daysUntilKickoff} {daysUntilKickoff === 1 ? 'DAY' : 'DAYS'}
            <small>until kickoff · June 11</small>
          </div>
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
      </section>

      <section>
        <h2>{t('home.hostCities')}</h2>
        <div className="city-grid">
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
