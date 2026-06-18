'use client';

/**
 * FitnessTracker — the local-first daily workout MVP.
 *
 * Everything lives in localStorage (see `fitnessStore`). The pure maths
 * (streaks, weekly rate, ring progress) is in `fitnessLogic` so it can be unit
 * tested without a DOM. Apple Watch / native step sync is deliberately stubbed
 * with a "native app" note — a web prototype can't talk to the watch.
 */
import { useEffect, useMemo, useState } from 'react';
import type { DayRecord, LogState, WorkoutMode } from '@/types/fitness';
import {
  MODES,
  MODE_META,
  MODE_TASKS,
  computeStreak,
  computeWeeklyStats,
  dateKey,
  dayProgress,
  weekKeys,
} from '@/services/fitnessLogic';
import { loadLog, recordFor, saveLog } from '@/services/fitnessStore';
import { ProgressRing } from '@/components/fitness/ProgressRing';
import { CelebrationConfetti } from '@/components/CelebrationConfetti';

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const pct = (fraction: number): number => Math.round(fraction * 100);

export const FitnessTracker = () => {
  const [mounted, setMounted] = useState(false);
  const [log, setLog] = useState<LogState>({});
  const [celebrate, setCelebrate] = useState(false);
  // Pin "today" once on mount so the view is stable across a session.
  const [today] = useState(() => dateKey());

  useEffect(() => {
    setLog(loadLog());
    setMounted(true);
  }, []);

  const todayRecord = useMemo(
    () => recordFor(log, today),
    [log, today],
  );
  const mode = todayRecord.mode;
  const tasks = MODE_TASKS[mode];
  const checkedSet = useMemo(
    () => new Set(todayRecord.checked),
    [todayRecord.checked],
  );
  const doneCount = tasks.filter((t) => checkedSet.has(t.id)).length;
  const todayFraction = tasks.length === 0 ? 0 : doneCount / tasks.length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  const streak = useMemo(() => computeStreak(log, today), [log, today]);
  const weekly = useMemo(
    () => computeWeeklyStats(log, today),
    [log, today],
  );
  const week = useMemo(() => weekKeys(today), [today]);

  /** Apply a mutation to today's record and persist. */
  const updateToday = (mutate: (record: DayRecord) => DayRecord): void => {
    setLog((prev) => {
      const current = recordFor(prev, today);
      const next: LogState = { ...prev, [today]: mutate({ ...current }) };
      saveLog(next);
      return next;
    });
  };

  const toggleTask = (id: string): void => {
    const willComplete =
      !checkedSet.has(id) && doneCount + 1 === tasks.length;
    updateToday((record) => {
      const checked = new Set(record.checked);
      if (checked.has(id)) checked.delete(id);
      else checked.add(id);
      return { ...record, checked: Array.from(checked) };
    });
    if (willComplete) setCelebrate(true);
  };

  const switchMode = (next: WorkoutMode): void => {
    updateToday((record) => ({ ...record, mode: next }));
  };

  const setNumber = (field: 'cardioMinutes' | 'steps', value: number): void => {
    updateToday((record) => ({
      ...record,
      [field]: Number.isFinite(value) && value > 0 ? Math.round(value) : 0,
    }));
  };

  // Auto-clear the easter-egg confetti.
  useEffect(() => {
    if (!celebrate) return;
    const timer = window.setTimeout(() => setCelebrate(false), 2600);
    return () => window.clearTimeout(timer);
  }, [celebrate]);

  if (!mounted) {
    return (
      <div className="fitness" aria-busy="true">
        <p className="fitness__loading">加载本地数据…</p>
      </div>
    );
  }

  return (
    <div className="fitness">
      {celebrate && <CelebrationConfetti />}

      <header className="fitness__head">
        <h1>每日运动</h1>
        <p className="fitness__sub">
          打卡 · 连续天数 · 本周节奏，全部存在这台设备上。
        </p>
      </header>

      {/* Top stats: today ring + streak + weekly rate */}
      <section className="fitness__top">
        <div className="fitness-card fitness-card--ring">
          <ProgressRing
            progress={todayFraction}
            size={160}
            stroke={14}
            label={`今日完成 ${doneCount} / ${tasks.length}`}
          >
            <span className="fitness-ring__big">{pct(todayFraction)}%</span>
            <span className="fitness-ring__small">
              {doneCount}/{tasks.length}
            </span>
          </ProgressRing>
          <p className="fitness-card__caption">
            {allDone ? '今天全部完成 🎉' : '今日打卡'}
          </p>
        </div>

        <div className="fitness-stats">
          <div className="fitness-card fitness-card--stat">
            <span className="fitness-stat__value">{streak}</span>
            <span className="fitness-stat__label">连续天数</span>
            <span className="fitness-stat__hint">
              当天勾任意一项即算坚持
            </span>
          </div>
          <div className="fitness-card fitness-card--stat">
            <span className="fitness-stat__value">{pct(weekly.rate)}%</span>
            <span className="fitness-stat__label">本周完成率</span>
            <span className="fitness-stat__hint">
              周一至今 {weekly.keptDays}/{weekly.elapsedDays} 天
            </span>
          </div>
        </div>
      </section>

      {/* Seven little week rings */}
      <section className="fitness-card fitness-week">
        <h2 className="fitness-section__title">本周节奏</h2>
        <div className="fitness-week__strip">
          {week.map((key, i) => {
            const isToday = key === today;
            const isFuture = key > today;
            const fraction = dayProgress(log[key]);
            return (
              <div
                key={key}
                className={
                  'fitness-week__day' +
                  (isToday ? ' fitness-week__day--today' : '') +
                  (isFuture ? ' fitness-week__day--future' : '')
                }
              >
                <ProgressRing
                  progress={fraction}
                  size={44}
                  stroke={5}
                  highlight={isToday}
                  label={`周${WEEKDAY_LABELS[i]} 完成 ${pct(fraction)}%`}
                />
                <span className="fitness-week__label">
                  {WEEKDAY_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mode switch */}
      <section className="fitness-card fitness-modes">
        <h2 className="fitness-section__title">今日模式</h2>
        <div className="fitness-modes__row" role="group" aria-label="选择今日模式">
          {MODES.map((m) => {
            const meta = MODE_META[m];
            const active = m === mode;
            return (
              <button
                key={m}
                type="button"
                className={
                  'fitness-mode' + (active ? ' fitness-mode--active' : '')
                }
                aria-pressed={active}
                onClick={() => switchMode(m)}
              >
                <span className="fitness-mode__emoji">{meta.emoji}</span>
                <span className="fitness-mode__label">{meta.label}</span>
              </button>
            );
          })}
        </div>
        <p className="fitness-modes__blurb">{MODE_META[mode].blurb}</p>
      </section>

      {/* Today's checklist */}
      <section className="fitness-card fitness-checklist">
        <h2 className="fitness-section__title">
          {MODE_META[mode].emoji} {MODE_META[mode].label}清单
        </h2>
        <ul className="fitness-checklist__list">
          {tasks.map((task) => {
            const done = checkedSet.has(task.id);
            return (
              <li key={task.id}>
                <label
                  className={
                    'fitness-task' + (done ? ' fitness-task--done' : '')
                  }
                >
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className="fitness-task__box" aria-hidden="true" />
                  <span className="fitness-task__label">{task.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Manual cardio + steps */}
      <section className="fitness-card fitness-metrics">
        <h2 className="fitness-section__title">手动记录</h2>
        <div className="fitness-metrics__row">
          <label className="fitness-metric">
            <span className="fitness-metric__label">有氧时长（分钟）</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={todayRecord.cardioMinutes || ''}
              placeholder="0"
              onChange={(e) =>
                setNumber('cardioMinutes', Number(e.target.value))
              }
            />
          </label>
          <label className="fitness-metric">
            <span className="fitness-metric__label">步数</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={todayRecord.steps || ''}
              placeholder="0"
              onChange={(e) => setNumber('steps', Number(e.target.value))}
            />
          </label>
        </div>
        <p className="fitness-metrics__note">
          ⌚ Apple Watch 自动同步步数与心率 —— 原生版会做（网页原型连不了手表）。
        </p>
      </section>
    </div>
  );
};
