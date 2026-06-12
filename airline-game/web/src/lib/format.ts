// Money formatting in ops-center style: $1.2B / $420M / $9.5K.

export const formatMoney = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  const scale = (scaled: number, unit: string): string => {
    const text =
      scaled >= 100
        ? String(Math.round(scaled))
        : (Math.round(scaled * 10) / 10).toFixed(1).replace(/\.0$/, '');
    return `${sign}$${text}${unit}`;
  };

  if (abs >= 1e9) return scale(abs / 1e9, 'B');
  if (abs >= 1e6) return scale(abs / 1e6, 'M');
  if (abs >= 1e3) return scale(abs / 1e3, 'K');
  return `${sign}$${Math.round(abs)}`;
};

export const formatPercent = (fraction: number): string =>
  `${Math.round(fraction * 100)}%`;

export const formatKm = (km: number): string => `${Math.round(km).toLocaleString('en-US')} km`;
