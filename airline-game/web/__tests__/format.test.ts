import { formatKm, formatMoney, formatPercent } from '@/lib/format';

describe('formatMoney', () => {
  it('formats billions with one trimmed decimal', () => {
    expect(formatMoney(1_200_000_000)).toBe('$1.2B');
    expect(formatMoney(1_000_000_000)).toBe('$1B');
    expect(formatMoney(2_550_000_000)).toBe('$2.6B');
  });

  it('formats millions', () => {
    expect(formatMoney(420_000_000)).toBe('$420M');
    expect(formatMoney(53_400_000)).toBe('$53.4M');
    expect(formatMoney(1_000_000)).toBe('$1M');
  });

  it('formats thousands and small values', () => {
    expect(formatMoney(9_500)).toBe('$9.5K');
    expect(formatMoney(999)).toBe('$999');
    expect(formatMoney(0)).toBe('$0');
  });

  it('keeps the sign on negative values', () => {
    expect(formatMoney(-120_000_000)).toBe('-$120M');
    expect(formatMoney(-1_750_000_000)).toBe('-$1.8B');
  });
});

describe('formatPercent', () => {
  it('renders 0–1 fractions as whole percentages', () => {
    expect(formatPercent(0.825)).toBe('83%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(1)).toBe('100%');
  });
});

describe('formatKm', () => {
  it('renders thousands separators with a km suffix', () => {
    expect(formatKm(14140)).toBe('14,140 km');
    expect(formatKm(555.6)).toBe('556 km');
  });
});
