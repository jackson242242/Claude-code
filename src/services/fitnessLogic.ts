/**
 * Pure logic for the fitness tracker: checklists, date maths, streaks and
 * weekly stats. No I/O here (localStorage lives in `fitnessStore.ts`) so this
 * module is trivially unit-testable.
 */
import type {
  DayRecord,
  FitnessTask,
  LogState,
  WeeklyStats,
  WorkoutMode,
} from '@/types/fitness';

/** Display metadata for each mode. */
export const MODE_META: Record<
  WorkoutMode,
  { label: string; emoji: string; blurb: string }
> = {
  gym: { label: '健身房', emoji: '🏋️', blurb: '力量为主，配一组有氧' },
  home: { label: '居家', emoji: '🏠', blurb: '徒手 + 核心，零器械' },
  rest: { label: '休息', emoji: '🌙', blurb: '低强度恢复，照顾睡眠' },
};

/** The default daily checklist for each mode. Task ids are mode-prefixed. */
export const MODE_TASKS: Record<WorkoutMode, readonly FitnessTask[]> = {
  gym: [
    { id: 'gym-warmup', label: '热身 5 分钟' },
    { id: 'gym-strength', label: '力量训练' },
    { id: 'gym-cardio', label: '有氧' },
    { id: 'gym-stretch', label: '拉伸放松' },
  ],
  home: [
    { id: 'home-warmup', label: '热身 5 分钟' },
    { id: 'home-core', label: '核心训练' },
    { id: 'home-bodyweight', label: '徒手力量' },
    { id: 'home-stretch', label: '拉伸放松' },
  ],
  rest: [
    { id: 'rest-walk', label: '散步 20 分钟' },
    { id: 'rest-mobility', label: '关节活动 / 拉伸' },
    { id: 'rest-sleep', label: '早睡' },
  ],
};

export const MODES: readonly WorkoutMode[] = ['gym', 'home', 'rest'];

/** Local-time `YYYY-MM-DD` for a Date (defaults to now). */
export const dateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** The `YYYY-MM-DD` one day before the given key. */
export const previousDayKey = (key: string): string => {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
};

/**
 * The seven `YYYY-MM-DD` keys for the Monday→Sunday week containing `today`.
 * Monday is treated as the first day of the week.
 */
export const weekKeys = (today: string): string[] => {
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // JS: 0=Sun…6=Sat. Shift so Monday=0.
  const offsetToMonday = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - offsetToMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return dateKey(day);
  });
};

/** A day counts as "kept" when at least one task was ticked. */
export const isKept = (record: DayRecord | undefined): boolean =>
  !!record && record.checked.length > 0;

/** Ids of `record.checked` that belong to the record's current mode. */
const checkedInMode = (record: DayRecord | undefined): string[] => {
  if (!record) return [];
  const ids = new Set(MODE_TASKS[record.mode].map((t) => t.id));
  return record.checked.filter((id) => ids.has(id));
};

/**
 * Progress (0–1) of a day against its own mode's checklist. Rest days have a
 * shorter list, so the ring fills faster — that's intended.
 */
export const dayProgress = (record: DayRecord | undefined): number => {
  if (!record) return 0;
  const total = MODE_TASKS[record.mode].length;
  if (total === 0) return 0;
  return checkedInMode(record).length / total;
};

/**
 * Consecutive kept days ending at today (or yesterday, so an as-yet-untouched
 * today doesn't reset a live streak).
 */
export const computeStreak = (log: LogState, today: string): number => {
  let cursor = isKept(log[today]) ? today : previousDayKey(today);
  let streak = 0;
  while (isKept(log[cursor])) {
    streak += 1;
    cursor = previousDayKey(cursor);
  }
  return streak;
};

/** Weekly completion, Monday→today inclusive. */
export const computeWeeklyStats = (
  log: LogState,
  today: string,
): WeeklyStats => {
  const days = weekKeys(today);
  const elapsed = days.filter((key) => key <= today);
  const keptDays = elapsed.filter((key) => isKept(log[key])).length;
  const elapsedDays = elapsed.length;
  return {
    keptDays,
    elapsedDays,
    rate: elapsedDays === 0 ? 0 : keptDays / elapsedDays,
  };
};
