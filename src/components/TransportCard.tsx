import type { TransportMode, TransportOffer } from '@/types';
import { formatDuration, formatPriceUsd } from '@/lib/format';

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

export const TransportCard = ({ offer }: TransportCardProps) => (
  <div className="offer-card" data-testid="transport-card">
    <div className="offer-card__title">{MODE_LABELS[offer.mode]}</div>
    <div className="offer-card__route">
      {offer.origin} → {offer.destination}
    </div>
    <div className="offer-card__meta">
      <span>{formatDuration(offer.durationMinutes)}</span>
    </div>
    <div className="offer-card__price">{formatPriceUsd(offer.priceUsd)}</div>
  </div>
);
