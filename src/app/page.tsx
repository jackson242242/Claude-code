import Link from 'next/link';
import { getCities } from '@/services/scheduleService';
import { CityCard } from '@/components/CityCard';
import { getLocale } from '@/i18n/server';
import { translator } from '@/i18n';

const HomePage = async () => {
  const [cities, locale] = await Promise.all([getCities(), getLocale()]);
  const t = translator(locale);

  return (
    <div className="home">
      <section className="hero">
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
