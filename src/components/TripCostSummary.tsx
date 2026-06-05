'use client';

import type { TripItem } from '@/types';
import { calculateTripCostBreakdown, tripItemKindLabel } from '@/services/itinerary';
import { formatPriceUsd } from '@/lib/format';

interface TripCostSummaryProps {
  items: TripItem[];
  totalUsd: number;
}

export const TripCostSummary = ({ items, totalUsd }: TripCostSummaryProps) => {
  const breakdown = calculateTripCostBreakdown(items);

  return (
    <div className="trip-cost-summary">
      {items.length > 0 ? (
        <>
          <h3>Cost breakdown</h3>
          <ul className="cost-breakdown-list">
            {breakdown.flight > 0 && (
              <li className="cost-breakdown-item">
                <span>{tripItemKindLabel('flight')}</span>
                <span className="cost-breakdown-value">
                  {formatPriceUsd(breakdown.flight)}
                </span>
              </li>
            )}
            {breakdown.hotel > 0 && (
              <li className="cost-breakdown-item">
                <span>{tripItemKindLabel('hotel')}</span>
                <span className="cost-breakdown-value">
                  {formatPriceUsd(breakdown.hotel)}
                </span>
              </li>
            )}
            {breakdown.transport > 0 && (
              <li className="cost-breakdown-item">
                <span>{tripItemKindLabel('transport')}</span>
                <span className="cost-breakdown-value">
                  {formatPriceUsd(breakdown.transport)}
                </span>
              </li>
            )}
            {breakdown.match > 0 && (
              <li className="cost-breakdown-item">
                <span>{tripItemKindLabel('match')}</span>
                <span className="cost-breakdown-value">
                  {formatPriceUsd(breakdown.match)}
                </span>
              </li>
            )}
          </ul>
          <div className="cost-breakdown-total">
            <strong>Trip total</strong>
            <strong className="trip-total-value">{formatPriceUsd(totalUsd)}</strong>
          </div>
        </>
      ) : null}
    </div>
  );
};
