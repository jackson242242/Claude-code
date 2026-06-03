import type { City, Match, Venue } from '@/types';
import { VenueInfo } from './VenueInfo';
import { HotelSearch } from './HotelSearch';
import { FlightSearch } from './FlightSearch';
import { TransportSearch } from './TransportSearch';

interface NearbyOptionsProps {
  match: Match;
  venue: Venue;
  city: City | null;
  cities: City[];
}

const nextDay = (ymd: string): string => {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
};

export const NearbyOptions = ({
  match,
  venue,
  city,
  cities,
}: NearbyOptionsProps) => {
  const checkIn = match.kickoffLocal.slice(0, 10);
  const checkOut = nextDay(checkIn);
  const primaryAirport = venue.nearestAirports[0] ?? '';
  const venueLabel = city ? city.name : venue.name;

  return (
    <div className="nearby">
      <VenueInfo venue={venue} city={city} />

      <details className="nearby__panel" open>
        <summary>Hotels near {venue.name}</summary>
        <HotelSearch
          cities={cities}
          defaultCityId={venue.cityId}
          defaultCheckIn={checkIn}
          defaultCheckOut={checkOut}
        />
      </details>

      <details className="nearby__panel">
        <summary>Flights to {primaryAirport || venueLabel}</summary>
        <FlightSearch defaultDestination={primaryAirport} defaultDate={checkIn} />
      </details>

      <details className="nearby__panel">
        <summary>Transport around {venueLabel}</summary>
        <TransportSearch defaultDestination={venue.name} defaultDate={checkIn} />
      </details>
    </div>
  );
};
