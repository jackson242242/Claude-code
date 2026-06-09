'use client';

import Link from 'next/link';
import type { NewsItem } from '@/types/news';
import { MOCK_CITIES } from '@/mocks/cities';

interface ConversionBridgeProps {
  /** A news item with a ctaCityId to build the bridge around */
  item: NewsItem;
}

const getCityName = (cityId: string): string => {
  const city = MOCK_CITIES.find((c) => c.id === cityId);
  return city?.name ?? cityId;
};

export const ConversionBridge = ({ item }: ConversionBridgeProps) => {
  if (item.ctaCityId == null) return null;

  const cityId = item.ctaCityId;
  const cityName = getCityName(cityId);

  const hotelsHref = `/hotels?city=${encodeURIComponent(cityId)}`;
  const flightsHref = `/flights?destination=${encodeURIComponent(cityId)}`;
  const matchesHref = `/schedule?city=${encodeURIComponent(cityId)}`;

  return (
    <section
      aria-label={`Book your trip to ${cityName}`}
      className="relative rounded-[1.125rem] overflow-hidden shadow-[0_16px_48px_rgba(13,22,33,0.14)] p-6 sm:p-8"
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0a8f84] to-[#11b3c6]"
        aria-hidden="true"
      />
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 80%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-4">
        <div>
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest m-0">
            Your team is playing in
          </p>
          <p className="text-white text-2xl font-bold leading-tight m-0">{cityName}</p>
        </div>

        <p className="text-white/90 text-sm leading-relaxed m-0 max-w-md">
          Don&apos;t miss it — book your flights and hotels while availability lasts.
        </p>

        <div className="flex flex-wrap gap-3 mt-1">
          {/* Primary CTA — book trip */}
          <Link
            href={hotelsHref}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-[10px] bg-white text-[#0a8f84] font-bold text-sm transition-all duration-150 hover:bg-[#f0fffe] hover:shadow-md hover:-translate-y-0.5 active:bg-[#e0f7f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
            data-testid="conversion-bridge-hotels-link"
          >
            Book this trip →
          </Link>

          {/* Secondary — flights */}
          <Link
            href={flightsHref}
            className="inline-flex items-center h-11 px-5 rounded-[10px] border-2 border-white text-white font-semibold text-sm transition-all duration-150 hover:bg-white/10 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
          >
            Find flights
          </Link>

          {/* Match details */}
          <Link
            href={matchesHref}
            className="inline-flex items-center h-11 px-5 rounded-[10px] text-white/80 font-semibold text-sm hover:text-white underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
          >
            Match details
          </Link>
        </div>
      </div>
    </section>
  );
};
