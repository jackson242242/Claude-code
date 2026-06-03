import Link from 'next/link';
import { getCities } from '@/services/scheduleService';
import { CityCard } from '@/components/CityCard';

const HomePage = async () => {
  const cities = await getCities();
  return (
    <div className="home">
      <section className="hero">
        <h1>Your 2026 World Cup, sorted.</h1>
        <p>
          Browse all 104 matches across 16 host cities in the USA, Canada and
          Mexico — then book the flights, hotels and transport to follow your
          team.
        </p>
        <div className="hero__actions">
          <Link className="btn" href="/schedule">
            Explore the schedule
          </Link>
          <Link className="btn btn--ghost" href="/hotels">
            Find hotels
          </Link>
        </div>
      </section>

      <section>
        <h2>Host cities</h2>
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
