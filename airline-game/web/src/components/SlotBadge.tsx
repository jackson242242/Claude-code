// Compact slot-market chips for one city: 持有 / 占用 / 池 taken/capacity.
// Shared by the 航线 tab open-route flow and the map's city tap panel — single
// source of markup, no duplication (M2.2).
import { isPoolFull } from '@/lib/slots';
import type { CitySlotInfo } from '@/types';

type SlotBadgeProps = {
  cityId: string;
  info: CitySlotInfo | undefined;
};

export const SlotBadge = ({ cityId, info }: SlotBadgeProps) => {
  // Older snapshots may lack this city — render nothing rather than guessing.
  if (!info) return null;
  const full = isPoolFull(info);

  return (
    <span
      data-testid={`slot-badge-${cityId}`}
      className="inline-flex flex-wrap items-center gap-1 text-[10px] leading-none"
    >
      <span className="rounded-full border border-ops-600 bg-ops-800 px-1.5 py-0.5 text-slate-300">
        持有 {info.playerHeld}
      </span>
      <span className="rounded-full border border-ops-600 bg-ops-800 px-1.5 py-0.5 text-slate-400">
        占用 {info.playerUsed}
      </span>
      <span
        className={`rounded-full border px-1.5 py-0.5 ${
          full
            ? 'border-red-900 bg-red-950/60 text-red-400'
            : 'border-ops-600 bg-ops-800 text-slate-400'
        }`}
      >
        池 {info.taken}/{info.capacity}
      </span>
    </span>
  );
};
