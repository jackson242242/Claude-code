/**
 * Types for the local-first fitness tracker (MVP).
 *
 * Everything here is persisted in the browser's localStorage — there is no
 * backend for this feature yet. Native, device-synced data (e.g. Apple Watch
 * steps/heart-rate) is intentionally out of scope for the web prototype and is
 * surfaced in the UI as "coming in the native app".
 */

/** The three daily modes a fan can be in. */
export type WorkoutMode = 'gym' | 'home' | 'rest';

/** A single check-off item inside a mode's daily checklist. */
export interface FitnessTask {
  /** Stable, mode-prefixed id (e.g. `gym-strength`) used as the checked key. */
  id: string;
  label: string;
}

/** One calendar day's record, keyed by `YYYY-MM-DD` in the LogState map. */
export interface DayRecord {
  /** Local date, `YYYY-MM-DD`. */
  date: string;
  /** The mode selected for this day. */
  mode: WorkoutMode;
  /** Ids of the tasks ticked off this day (may span past modes). */
  checked: string[];
  /** Manually-entered cardio minutes. */
  cardioMinutes: number;
  /** Manually-entered step count. */
  steps: number;
}

/** The whole persisted log: date → record. */
export type LogState = Record<string, DayRecord>;

/** Aggregate weekly progress, Monday → today. */
export interface WeeklyStats {
  /** Days this week (Mon→today) with at least one ticked task. */
  keptDays: number;
  /** Days elapsed this week, Mon→today inclusive. */
  elapsedDays: number;
  /** keptDays / elapsedDays as a 0–1 fraction (0 when no days elapsed). */
  rate: number;
}
