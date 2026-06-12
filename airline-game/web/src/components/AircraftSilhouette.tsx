// Top-view aircraft silhouette — the graceful fallback when a model photo is
// missing from aircraft-images.json or fails to load (CONTRACT §6).
type AircraftSilhouetteProps = {
  label: string;
};

export const AircraftSilhouette = ({ label }: AircraftSilhouetteProps) => (
  <div
    data-testid="aircraft-silhouette"
    className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-ops-800 to-ops-900"
  >
    <svg viewBox="0 0 100 100" className="h-16 w-16" aria-hidden="true">
      <path
        d="M50 8 C52.5 8 54 12 54.3 18 L54.8 38 L92 56 L92 63 L55 52 L54 76 L66 85 L66 90 L50 86 L34 90 L34 85 L46 76 L45 52 L8 63 L8 56 L45.2 38 L45.7 18 C46 12 47.5 8 50 8 Z"
        fill="none"
        stroke="#22d3ee"
        strokeWidth={2}
        strokeLinejoin="round"
        opacity={0.75}
      />
    </svg>
    <span className="px-2 text-center text-xs font-semibold tracking-wide text-slate-400">
      {label}
    </span>
  </div>
);
