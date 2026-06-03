import type { TripItem } from '@/types';
import { tripItemKindLabel } from '@/services/itinerary';
import { formatPriceUsd } from '@/lib/format';

interface TripItemRowProps {
  item: TripItem;
  onRemove?: (itemId: string) => void;
}

export const TripItemRow = ({ item, onRemove }: TripItemRowProps) => (
  <li className="trip-item" data-testid="trip-item">
    <span className={`badge badge--${item.kind}`}>
      {tripItemKindLabel(item.kind)}
    </span>
    <span className="trip-item__main">
      <span className="trip-item__title">{item.title}</span>
      {item.subtitle ? (
        <span className="trip-item__subtitle">{item.subtitle}</span>
      ) : null}
    </span>
    {item.priceUsd > 0 ? (
      <span className="trip-item__price">{formatPriceUsd(item.priceUsd)}</span>
    ) : null}
    {onRemove ? (
      <button
        type="button"
        className="link-btn"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.title}`}
      >
        Remove
      </button>
    ) : null}
  </li>
);
