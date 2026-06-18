/**
 * localStorage persistence for the fitness tracker. Keeps the (small) I/O layer
 * separate from the pure logic in `fitnessLogic.ts`.
 */
import type { DayRecord, LogState, WorkoutMode } from '@/types/fitness';
import { dateKey } from '@/services/fitnessLogic';

const STORAGE_KEY = 'wc2026:fitness:v1';

/** A blank record for a given day/mode. */
export const emptyRecord = (
  date: string,
  mode: WorkoutMode = 'gym',
): DayRecord => ({
  date,
  mode,
  checked: [],
  cardioMinutes: 0,
  steps: 0,
});

const isRecord = (value: unknown): value is DayRecord => {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Partial<DayRecord>;
  return (
    typeof r.date === 'string' &&
    (r.mode === 'gym' || r.mode === 'home' || r.mode === 'rest') &&
    Array.isArray(r.checked) &&
    typeof r.cardioMinutes === 'number' &&
    typeof r.steps === 'number'
  );
};

/** Reads and validates the persisted log; returns `{}` when absent/corrupt. */
export const loadLog = (): LogState => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: LogState = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isRecord(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
};

/** Persists the whole log (best-effort; storage failures are swallowed). */
export const saveLog = (log: LogState): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // Quota or privacy mode — nothing actionable to do in an MVP.
  }
};

/** Returns the record for `date`, creating a blank one if missing. */
export const recordFor = (
  log: LogState,
  date: string = dateKey(),
): DayRecord => log[date] ?? emptyRecord(date);
