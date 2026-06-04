import type { FlightOffer } from '@/types';
import { formatDuration, formatPriceUsd } from '@/lib/format';

interface FlightCardProps {
  offer: FlightOffer;
}

export const FlightCard = ({ offer }: FlightCardProps) => (
  <div className="offer-card" data-testid="flight-card">
    <div className="offer-card__title">{offer.airline}</div>
    <div className="offer-card__route">
      {offer.origin} → {offer.destination}
    </div>
    <div className="offer-card__meta">
      <span>{formatDuration(offer.durationMinutes)}</span>
      <span>
        {offer.stops === 0
          ? 'Non-stop'
          : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
      </span>
    </div>
    <div className="offer-card__price">{formatPriceUsd(offer.priceUsd)}</div>
    {offer.deepLink && (
      <a
        href={offer.deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className="offer-card__book"
      >
        Book now →
      </a>
    )}
  </div>
);
