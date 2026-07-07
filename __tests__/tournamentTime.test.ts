import { tournamentToday } from '@/lib/tournamentTime';

describe('tournamentToday', () => {
  it('uses the venue-region date, not UTC, during Americas evenings', () => {
    // 2026-07-08T02:00Z is 2026-07-07 22:00 in New York (EDT, UTC-4).
    // A naive UTC slice would return 2026-07-08 and miss tonight's matches.
    expect(tournamentToday(Date.UTC(2026, 6, 8, 2, 0))).toBe('2026-07-07');
  });

  it('agrees with UTC during host daytime', () => {
    // 2026-07-07T16:00Z is 2026-07-07 12:00 in New York — same calendar day.
    expect(tournamentToday(Date.UTC(2026, 6, 7, 16, 0))).toBe('2026-07-07');
  });

  it('formats as a zero-padded YYYY-MM-DD prefix', () => {
    expect(tournamentToday(Date.UTC(2026, 5, 11, 18, 0))).toBe('2026-06-11');
  });
});
