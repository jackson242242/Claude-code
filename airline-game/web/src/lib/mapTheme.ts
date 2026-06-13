// V3.2: Map theme definitions.
// Each theme describes the colors used inside WorldMap SVG + CSS variable hints.
// Only map-related and panel-accent colors are themed; panels stay dark.

export type MapThemeId = 'dark-ops' | 'light-day' | 'retro-chart';

export type MapTheme = {
  id: MapThemeId;
  /** SVG fill for the sphere background (or sea rect in flat projections). */
  seaFill: string;
  /** SVG stroke for the sphere outline. */
  seaStroke: string;
  /** SVG fill for land masses. */
  landFill: string;
  /** SVG stroke for land outlines. */
  landStroke: string;
  /** SVG stroke for graticule lines. */
  graticuleStroke: string;
  /** Stroke dasharray for graticule. 'none' = solid. */
  graticuleDash: string;
  /** Route arc primary stroke color. */
  routeColor: string;
  /** Competitor arc stroke color base. */
  competitorColor: string;
  /** City dot default fill. */
  cityDotFill: string;
  /** City label default fill. */
  cityLabelFill: string;
  /** HQ dot fill. */
  hqFill: string;
  /** Selected city accent. */
  selectedAccent: string;
  /** Ocean radial gradient start. */
  oceanGradStart: string;
  /** Ocean radial gradient end. */
  oceanGradEnd: string;
};

export const MAP_THEMES: Record<MapThemeId, MapTheme> = {
  'dark-ops': {
    id: 'dark-ops',
    seaFill: 'url(#ocean)',
    seaStroke: '#16263f',
    landFill: '#101f36',
    landStroke: '#1f3354',
    graticuleStroke: '#0e1a2e',
    graticuleDash: 'none',
    routeColor: '#22d3ee',
    competitorColor: '#64748b',
    cityDotFill: '#7da7c4',
    cityLabelFill: '#5b7a96',
    hqFill: '#fbbf24',
    selectedAccent: '#22d3ee',
    oceanGradStart: '#0a1626',
    oceanGradEnd: '#04070f',
  },
  'light-day': {
    id: 'light-day',
    seaFill: 'url(#ocean)',
    seaStroke: '#94a3b8',
    landFill: '#d4b896',
    landStroke: '#a8856a',
    graticuleStroke: '#c0cfe0',
    graticuleDash: 'none',
    routeColor: '#0369a1',
    competitorColor: '#64748b',
    cityDotFill: '#334155',
    cityLabelFill: '#1e3a5f',
    hqFill: '#b45309',
    selectedAccent: '#0369a1',
    oceanGradStart: '#c8ddf0',
    oceanGradEnd: '#a0bcd8',
  },
  'retro-chart': {
    id: 'retro-chart',
    seaFill: 'url(#ocean)',
    seaStroke: '#7c6545',
    landFill: '#d4b896',
    landStroke: '#8a6848',
    graticuleStroke: '#b8956a',
    graticuleDash: '4 6',
    routeColor: '#7c3420',
    competitorColor: '#8a7a60',
    cityDotFill: '#5c3a1e',
    cityLabelFill: '#4a2c10',
    hqFill: '#8b2500',
    selectedAccent: '#7c3420',
    oceanGradStart: '#e8d5b0',
    oceanGradEnd: '#c8b090',
  },
};

export const DEFAULT_THEME: MapThemeId = 'dark-ops';
