import { seatBreakdown, validateMix } from '@/lib/cabin';
import type { CabinMix } from '@/types';

describe('seatBreakdown — floor math (CONTRACT §3 M2.3)', () => {
  it('300 seats 70/20/10 → economy=210, business=24, first=6', () => {
    const mix: CabinMix = { economy: 70, business: 20, first: 10 };
    expect(seatBreakdown(300, mix)).toEqual({ economy: 210, business: 24, first: 6 });
  });

  it('floors fractional seats (does not round)', () => {
    // 165 seats × 70 / 100 = 115.5 → floor = 115
    // 165 × 20 / 100 / 2.5 = 13.2 → floor = 13
    // 165 × 10 / 100 / 5 = 3.3 → floor = 3
    const mix: CabinMix = { economy: 70, business: 20, first: 10 };
    expect(seatBreakdown(165, mix)).toEqual({ economy: 115, business: 13, first: 3 });
  });

  it('all-economy default {100,0,0} gives all seats in economy, 0 in others', () => {
    const mix: CabinMix = { economy: 100, business: 0, first: 0 };
    expect(seatBreakdown(200, mix)).toEqual({ economy: 200, business: 0, first: 0 });
  });

  it('all-business {0,100,0} gives 0 economy, floor(seats/2.5) business, 0 first', () => {
    // 200 × 100 / 100 / 2.5 = 80
    const mix: CabinMix = { economy: 0, business: 100, first: 0 };
    expect(seatBreakdown(200, mix)).toEqual({ economy: 0, business: 80, first: 0 });
  });

  it('all-first {0,0,100} gives floor(seats/5) first class seats', () => {
    // 200 × 100 / 100 / 5 = 40
    const mix: CabinMix = { economy: 0, business: 0, first: 100 };
    expect(seatBreakdown(200, mix)).toEqual({ economy: 0, business: 0, first: 40 });
  });

  it('zero seats returns all zeros', () => {
    const mix: CabinMix = { economy: 70, business: 20, first: 10 };
    expect(seatBreakdown(0, mix)).toEqual({ economy: 0, business: 0, first: 0 });
  });
});

describe('validateMix', () => {
  it('returns true for a valid all-economy mix', () => {
    expect(validateMix({ economy: 100, business: 0, first: 0 })).toBe(true);
  });

  it('returns true for a valid mixed cabin', () => {
    expect(validateMix({ economy: 70, business: 20, first: 10 })).toBe(true);
  });

  it('returns false when sum is not 100', () => {
    expect(validateMix({ economy: 80, business: 10, first: 5 })).toBe(false);
    expect(validateMix({ economy: 0, business: 0, first: 0 })).toBe(false);
    expect(validateMix({ economy: 50, business: 50, first: 1 })).toBe(false);
  });

  it('returns false when any value is negative', () => {
    expect(validateMix({ economy: 110, business: -10, first: 0 })).toBe(false);
  });

  it('returns false when any value is not an integer', () => {
    expect(validateMix({ economy: 70.5, business: 20, first: 9.5 })).toBe(false);
  });

  it('returns true when all three non-zero values sum to 100', () => {
    expect(validateMix({ economy: 60, business: 30, first: 10 })).toBe(true);
  });
});
