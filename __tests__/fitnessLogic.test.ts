import type { DayRecord, LogState, WorkoutMode } from '@/types/fitness';
import {
  MODE_TASKS,
  computeStreak,
  computeWeeklyStats,
  dateKey,
  dayProgress,
  isKept,
  previousDayKey,
  weekKeys,
} from '@/services/fitnessLogic';

const day = (
  date: string,
  checked: string[],
  mode: WorkoutMode = 'gym',
): DayRecord => ({
  date,
  mode,
  checked,
  cardioMinutes: 0,
  steps: 0,
});

const logFrom = (records: DayRecord[]): LogState =>
  Object.fromEntries(records.map((r) => [r.date, r]));

describe('date helpers', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 5, 18))).toBe('2026-06-18');
    expect(dateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
  });

  it('steps back across month/year boundaries', () => {
    expect(previousDayKey('2026-06-18')).toBe('2026-06-17');
    expect(previousDayKey('2026-03-01')).toBe('2026-02-28');
    expect(previousDayKey('2026-01-01')).toBe('2025-12-31');
  });

  it('returns Monday→Sunday for the week containing the date', () => {
    // 2026-06-18 is a Thursday.
    expect(weekKeys('2026-06-18')).toEqual([
      '2026-06-15',
      '2026-06-16',
      '2026-06-17',
      '2026-06-18',
      '2026-06-19',
      '2026-06-20',
      '2026-06-21',
    ]);
  });

  it('treats a Sunday as the last day of its week', () => {
    // 2026-06-21 is a Sunday.
    expect(weekKeys('2026-06-21')[0]).toBe('2026-06-15');
    expect(weekKeys('2026-06-21')[6]).toBe('2026-06-21');
  });
});

describe('isKept / dayProgress', () => {
  it('marks a day kept when at least one task is ticked', () => {
    expect(isKept(undefined)).toBe(false);
    expect(isKept(day('2026-06-18', []))).toBe(false);
    expect(isKept(day('2026-06-18', ['gym-warmup']))).toBe(true);
  });

  it('measures progress against the record mode checklist', () => {
    const total = MODE_TASKS.gym.length;
    expect(dayProgress(undefined)).toBe(0);
    expect(dayProgress(day('2026-06-18', []))).toBe(0);
    expect(dayProgress(day('2026-06-18', ['gym-warmup']))).toBeCloseTo(
      1 / total,
    );
    expect(
      dayProgress(day('2026-06-18', MODE_TASKS.gym.map((t) => t.id))),
    ).toBe(1);
  });

  it('ignores ticked ids that do not belong to the current mode', () => {
    // home tasks ticked but mode is gym → counts as 0 progress.
    const record = day('2026-06-18', ['home-core', 'home-warmup'], 'gym');
    expect(dayProgress(record)).toBe(0);
  });
});

describe('computeStreak', () => {
  const today = '2026-06-18';

  it('counts consecutive kept days ending today', () => {
    const log = logFrom([
      day('2026-06-16', ['gym-warmup']),
      day('2026-06-17', ['gym-warmup']),
      day('2026-06-18', ['gym-warmup']),
    ]);
    expect(computeStreak(log, today)).toBe(3);
  });

  it('does not reset when today is untouched but yesterday was kept', () => {
    const log = logFrom([
      day('2026-06-16', ['gym-warmup']),
      day('2026-06-17', ['gym-warmup']),
    ]);
    expect(computeStreak(log, today)).toBe(2);
  });

  it('stops at the first gap', () => {
    const log = logFrom([
      day('2026-06-15', ['gym-warmup']),
      // 06-16 missing → gap
      day('2026-06-17', ['gym-warmup']),
      day('2026-06-18', ['gym-warmup']),
    ]);
    expect(computeStreak(log, today)).toBe(2);
  });

  it('is zero with no history', () => {
    expect(computeStreak({}, today)).toBe(0);
  });
});

describe('computeWeeklyStats', () => {
  it('counts kept days Monday→today inclusive', () => {
    // Thursday 2026-06-18 → Mon..Thu = 4 elapsed days.
    const log = logFrom([
      day('2026-06-15', ['gym-warmup']), // Mon kept
      day('2026-06-16', []), // Tue not kept
      day('2026-06-18', ['gym-warmup']), // Thu kept
    ]);
    const stats = computeWeeklyStats(log, '2026-06-18');
    expect(stats.elapsedDays).toBe(4);
    expect(stats.keptDays).toBe(2);
    expect(stats.rate).toBeCloseTo(0.5);
  });

  it('does not count future days in the week', () => {
    const stats = computeWeeklyStats({}, '2026-06-15'); // Monday
    expect(stats.elapsedDays).toBe(1);
    expect(stats.keptDays).toBe(0);
    expect(stats.rate).toBe(0);
  });
});
