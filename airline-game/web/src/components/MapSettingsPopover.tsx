'use client';

// V3.2: Map settings popover — projection + theme picker.
// Persists selections to localStorage.

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n';
import type { ProjectionId } from '@/lib/map';
import type { MapThemeId } from '@/lib/mapTheme';
import type { DictKeys } from '@/i18n';

export const PROJECTION_STORAGE_KEY = 'skyempire.map.projection';
export const THEME_STORAGE_KEY = 'skyempire.theme';

const PROJECTIONS: ProjectionId[] = ['naturalEarth', 'globe', 'mercator'];
const THEMES: MapThemeId[] = ['dark-ops', 'light-day', 'retro-chart'];

// Mini SVG icons for projections
const PROJECTION_ICONS: Record<ProjectionId, string> = {
  naturalEarth:
    'M2 8 Q5 2 10 2 Q15 2 18 8 Q15 14 10 14 Q5 14 2 8Z M2 8 Q5 8 10 8 Q15 8 18 8 M10 2 Q8 5 8 8 Q8 11 10 14 M10 2 Q12 5 12 8 Q12 11 10 14',
  globe:
    'M10 2 A8 8 0 1 1 10 18 A8 8 0 1 1 10 2 M2 10 Q5 10 18 10 M10 2 Q7 6 7 10 Q7 14 10 18 M10 2 Q13 6 13 10 Q13 14 10 18',
  mercator:
    'M2 4 L18 4 M2 8 L18 8 M2 12 L18 12 M2 16 L18 16 M3 2 L3 18 M8 2 L8 18 M13 2 L13 18 M17 2 L17 18',
};

// Theme swatch colors (just show the sea + land tone)
const THEME_SWATCHES: Record<MapThemeId, { sea: string; land: string }> = {
  'dark-ops': { sea: '#0a1626', land: '#101f36' },
  'light-day': { sea: '#c8ddf0', land: '#d4b896' },
  'retro-chart': { sea: '#e8d5b0', land: '#d4b896' },
};

type MapSettingsPopoverProps = {
  projectionId: ProjectionId;
  themeId: MapThemeId;
  onProjectionChange: (p: ProjectionId) => void;
  onThemeChange: (t: MapThemeId) => void;
};

export const MapSettingsPopover = ({
  projectionId,
  themeId,
  onProjectionChange,
  onThemeChange,
}: MapSettingsPopoverProps) => {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={popoverRef} className="relative" data-testid="map-settings-container">
      <button
        type="button"
        aria-label={t('map.settings.aria')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-lg text-slate-400 hover:text-white"
        data-testid="map-settings-btn"
      >
        ⚙
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('map.settings.heading')}
          data-testid="map-settings-popover"
          className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-ops-600 bg-ops-900/95 p-3 shadow-xl backdrop-blur"
        >
          {/* Projection picker */}
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {t('map.projection.label')}
          </p>
          <div className="mb-3 flex gap-1.5" data-testid="projection-picker">
            {PROJECTIONS.map((pid) => (
              <button
                key={pid}
                type="button"
                aria-pressed={projectionId === pid}
                data-testid={`projection-option-${pid}`}
                title={t(`map.projection.${pid}` as DictKeys)}
                onClick={() => {
                  onProjectionChange(pid);
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem(PROJECTION_STORAGE_KEY, pid);
                  }
                }}
                className={`flex flex-1 flex-col items-center gap-1 rounded border p-1.5 transition ${
                  projectionId === pid
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-ops-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                <svg
                  viewBox="0 0 20 20"
                  width={28}
                  height={28}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={PROJECTION_ICONS[pid]} />
                </svg>
                <span className="text-[9px] font-medium leading-tight text-center">
                  {t(`map.projection.${pid}` as DictKeys)}
                </span>
              </button>
            ))}
          </div>

          {/* Theme picker */}
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {t('map.theme.label')}
          </p>
          <div className="flex gap-1.5" data-testid="theme-picker">
            {THEMES.map((tid) => {
              const swatch = THEME_SWATCHES[tid];
              return (
                <button
                  key={tid}
                  type="button"
                  aria-pressed={themeId === tid}
                  data-testid={`theme-option-${tid}`}
                  title={t(`map.theme.${tid}` as DictKeys)}
                  onClick={() => {
                    onThemeChange(tid);
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem(THEME_STORAGE_KEY, tid);
                    }
                  }}
                  className={`flex flex-1 flex-col items-center gap-1 rounded border p-1.5 transition ${
                    themeId === tid
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-ops-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {/* Swatch showing sea + land */}
                  <div
                    className="h-5 w-full rounded-sm overflow-hidden"
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(to right, ${swatch.sea} 50%, ${swatch.land} 50%)`,
                    }}
                  />
                  <span className="text-[9px] font-medium leading-tight text-center">
                    {t(`map.theme.${tid}` as DictKeys)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
