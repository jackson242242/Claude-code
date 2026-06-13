'use client';
// Pure-SVG sparkline used for the cash history in the finance tab.
import { useT } from '@/i18n';

type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
};

export const Sparkline = ({ values, width = 280, height = 64 }: SparklineProps) => {
  const { t } = useT();

  if (values.length === 0) {
    return <p className="text-xs text-slate-500">{t('sparkline.empty')}</p>;
  }

  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const pad = 4;
  const stepX = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const toY = (value: number) => pad + (height - pad * 2) * (1 - (value - min) / span);

  const points = values.map((value, index) => ({
    x: pad + index * stepX,
    y: toY(value),
  }));
  const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${pad},${toY(Math.max(min, 0)).toFixed(1)} ${line} ${(
    pad + (values.length - 1) * stepX
  ).toFixed(1)},${toY(Math.max(min, 0)).toFixed(1)}`;
  const zeroY = toY(0);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label={t('sparkline.aria')}
      data-testid="sparkline"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
        </linearGradient>
      </defs>
      {min < 0 && (
        <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke="#7f1d1d" strokeDasharray="3 3" strokeWidth={1} />
      )}
      <polygon points={area} fill="url(#spark-fill)" />
      <polyline points={line} fill="none" stroke="#22d3ee" strokeWidth={2} strokeLinejoin="round" />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill="#fbbf24"
        />
      )}
    </svg>
  );
};
