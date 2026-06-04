import type { HotelOffer } from '@/types';
import { formatPriceUsd } from '@/lib/format';

interface HotelCardProps {
  offer: HotelOffer;
}

export const HotelCard = ({ offer }: HotelCardProps) => (
  <div className="offer-card" data-testid="hotel-card">
    <div className="offer-card__title">{offer.name}</div>
    <div className="offer-card__meta">
      <span aria-label={`${offer.rating} star`}>{'★'.repeat(offer.rating)}</span>
      <span>{offer.distanceKm.toFixed(1)} km to venue</span>
    </div>
    <div className="offer-card__price">
      {formatPriceUsd(offer.pricePerNightUsd)}
      <span className="muted"> / night</span>
    </div>
    <div className="offer-card__total">
      {offer.nights} night{offer.nights === 1 ? '' : 's'} ·{' '}
      {formatPriceUsd(offer.priceUsd)} total
    </div>
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
