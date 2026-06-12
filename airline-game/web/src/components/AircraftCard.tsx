'use client';

import { useState } from 'react';
import { AircraftSilhouette } from '@/components/AircraftSilhouette';
import { formatKm, formatMoney } from '@/lib/format';
import type { AircraftImageEntry, AircraftModel } from '@/types';

type AircraftCardProps = {
  model: AircraftModel;
  image?: AircraftImageEntry;
  cash: number;
  busy: boolean;
  onBuy: (modelId: string) => void;
  onLease: (modelId: string) => void;
};

export const AircraftCard = ({ model, image, cash, busy, onBuy, onLease }: AircraftCardProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = image !== undefined && !imageFailed;
  const label = `${model.manufacturer} ${model.name}`;

  return (
    <article className="panel overflow-hidden" data-testid={`aircraft-card-${model.id}`}>
      <div className="relative h-32 w-full overflow-hidden sm:h-36">
        {showPhoto ? (
          <img
            src={image.url}
            alt={label}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <AircraftSilhouette label={label} />
        )}
        {model.badge && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-black">
            {model.badge}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <header className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-white">{model.name}</h3>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            {model.manufacturer}
          </span>
        </header>

        <dl className="grid grid-cols-3 gap-1 text-center">
          <div>
            <dt className="text-[10px] text-slate-500">座位</dt>
            <dd className="text-xs font-semibold text-slate-200">{model.seats}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-500">航程</dt>
            <dd className="text-xs font-semibold text-slate-200">{formatKm(model.rangeKm)}</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-500">价格</dt>
            <dd className="text-xs font-semibold text-accent">{formatMoney(model.price)}</dd>
          </div>
        </dl>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onBuy(model.id)}
            disabled={busy || cash < model.price}
            className="btn-primary flex-1 px-2 py-1.5 text-xs"
          >
            购买
          </button>
          <button
            type="button"
            onClick={() => onLease(model.id)}
            disabled={busy}
            className="btn-ghost flex-1 px-2 py-1.5 text-xs"
          >
            租赁
          </button>
        </div>
      </div>
    </article>
  );
};
