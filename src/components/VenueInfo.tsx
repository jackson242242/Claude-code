import type { City, Venue } from '@/types';

interface VenueInfoProps {
  venue: Venue;
  city: City | null;
}

export const VenueInfo = ({ venue, city }: VenueInfoProps) => (
  <div className="venue-info">
    <h3>{venue.name}</h3>
    <ul className="venue-info__facts">
      <li>
        <strong>City:</strong> {city ? `${city.name}, ${city.country}` : venue.cityId}
      </li>
      <li>
        <strong>Capacity:</strong> {venue.capacity.toLocaleString('en-US')}
      </li>
      <li>
        <strong>Nearest airports:</strong> {venue.nearestAirports.join(', ')}
      </li>
      {city ? (
        <li>
          <strong>Getting there:</strong> {city.transportNotes}
        </li>
      ) : null}
    </ul>
  </div>
);
