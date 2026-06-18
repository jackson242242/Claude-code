/**
 * A small SVG progress ring. `progress` is clamped to 0–1. Purely presentational
 * and SSR-safe (no client hooks), so it can be reused for both the big "today"
 * ring and the seven little week rings.
 */
interface ProgressRingProps {
  progress: number;
  /** Outer diameter in px. */
  size: number;
  /** Stroke width in px. */
  stroke: number;
  /** Highlight the ring (e.g. "today" in the week strip). */
  highlight?: boolean;
  /** Optional centre content (label, percentage, emoji). */
  children?: React.ReactNode;
  label?: string;
}

export const ProgressRing = ({
  progress,
  size,
  stroke,
  highlight = false,
  children,
  label,
}: ProgressRingProps) => {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div
      className="fitness-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--fitness-ring-track, rgba(0,0,0,0.08))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={
            highlight
              ? 'var(--fitness-ring-today, var(--accent))'
              : 'var(--fitness-ring, var(--festival-blue))'
          }
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {children && <div className="fitness-ring__center">{children}</div>}
    </div>
  );
};
