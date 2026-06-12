'use client';

import { AircraftCard } from '@/components/AircraftCard';
import { AIRCRAFT_IMAGES, AIRCRAFT_MODELS } from '@/lib/data';
import type { Command } from '@/types';

type MarketTabProps = {
  cash: number;
  busy: boolean;
  onCommands: (commands: Command[]) => void;
};

export const MarketTab = ({ cash, busy, onCommands }: MarketTabProps) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {AIRCRAFT_MODELS.map((model) => (
      <AircraftCard
        key={model.id}
        model={model}
        image={AIRCRAFT_IMAGES[model.id]}
        cash={cash}
        busy={busy}
        onBuy={(modelId) => onCommands([{ type: 'buyAircraft', modelId }])}
        onLease={(modelId) => onCommands([{ type: 'leaseAircraft', modelId }])}
      />
    ))}
  </div>
);
