import type { ThumbnailKind } from '@/types/touristVideo';
import type { SuperstarVideo } from '@/mocks/superstars';

const GRADIENT_MAP: Record<ThumbnailKind, string> = {
  'teal-to-turquoise': 'from-[#3d8bff] to-[#2f6fe0]',
  'grape-to-turquoise': 'from-[#7c5cff] to-[#2f6fe0]',
  'coral-to-gold': 'from-[#ff5d52] to-[#e0a82e]',
  'citrus-to-teal': 'from-[#7fb800] to-[#3d8bff]',
};

interface SuperstarCardProps {
  item: SuperstarVideo;
}

/**
 * A 9:16 link card that opens the player's highlights on YouTube in a new tab.
 * Pure links (no hosted/embedded footage) — always renders, never blacks out.
 */
export const SuperstarCard = ({ item }: SuperstarCardProps) => {
  const gradient = GRADIENT_MAP[item.thumbnailKind];

  return (
    <a
      href={item.watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch ${item.name} (${item.nation}) highlights on YouTube — opens in a new tab`}
      className="relative block w-[160px] flex-shrink-0 overflow-hidden rounded-[1.125rem] shadow-[0_6px_24px_rgba(0,0,0,0.45)] focus-visible:outline-2 focus-visible:outline-[#5a9dff] focus-visible:outline-offset-2"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Gradient thumbnail */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
        aria-hidden="true"
      />
      {/* Scrim for legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
        aria-hidden="true"
      />

      {/* Flag (top-left) + external badge (top-right) */}
      <span className="absolute left-2 top-2 text-2xl drop-shadow" aria-hidden="true">
        {item.flag}
      </span>
      <span
        className="absolute right-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white"
        aria-hidden="true"
      >
        ↗ YouTube
      </span>

      {/* Centered play affordance */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md">
          <div
            className="ml-1"
            style={{
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '14px solid #3d8bff',
            }}
          />
        </div>
      </div>

      {/* Name + nation + watch cue */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 px-2.5 pb-3">
        <p className="m-0 text-sm font-bold leading-tight text-white">
          {item.name}
        </p>
        <p className="m-0 text-[0.7rem] font-medium text-white/85">
          {item.nation} · {item.blurb} ▸ Watch ↗
        </p>
      </div>
    </a>
  );
};
