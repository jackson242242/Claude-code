import type { TransportMode, TransportOffer } from '@/types';
import { formatDuration, formatPriceUsd } from '@/lib/format';
import { googleMapsDirectionsLink, rideshareLinksFor } from '@/lib/rideshare';

const MODE_LABELS: Record<TransportMode, string> = {
  train: 'Train',
  bus: 'Bus',
  rideshare: 'Rideshare',
  shuttle: 'Shuttle',
  'car-rental': 'Car rental',
};

interface TransportCardProps {
  offer: TransportOffer;
}

export const TransportCard = ({ offer }: TransportCardProps) => {
  // Rideshare rows deep-link into Uber/Lyft on the phone with the dropoff
  // preset (live fare shows in the app — our price is an estimate). Hidden
  // when the destination doesn't resolve to a host city. Every mode gets a
  // Google Maps directions link with the matching travel mode.
  const rideshare =
    offer.mode === 'rideshare' ? rideshareLinksFor(offer.destination) : null;
  const mapsLink = googleMapsDirectionsLink(
    offer.origin,
    offer.destination,
    offer.mode,
  );

  return (
    <div className="offer-card" data-testid="transport-card">
      <div className="offer-card__title">{MODE_LABELS[offer.mode]}</div>
      <div className="offer-card__route">
        {offer.origin} → {offer.destination}
      </div>
      <div className="offer-card__meta">
        <span>{formatDuration(offer.durationMinutes)}</span>
      </div>
      <div className="offer-card__price">{formatPriceUsd(offer.priceUsd)}</div>
      {rideshare != null ? (
        <div className="offer-card__book offer-card__book--split">
          <a
            href={rideshare.uber}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open Uber to ${rideshare.cityName} — live fare shows in the app`}
          >
            Uber ↗
          </a>
          <a
            href={rideshare.lyft}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open Lyft to ${rideshare.cityName} — live fare shows in the app`}
          >
            Lyft ↗
          </a>
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Directions to ${offer.destination} in Google Maps`}
          >
            Maps ↗
          </a>
        </div>
      ) : (
        <div className="offer-card__book">
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Directions from ${offer.origin} to ${offer.destination} in Google Maps`}
          >
            Directions in Google Maps ↗
          </a>
        </div>
      )}
    </div>
  );
};
