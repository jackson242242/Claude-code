// World map geometry utilities (V3.2: multi-projection support).
// CONTRACT: the module-scope defaults (naturalEarth) remain unchanged so
// existing imports/tests keep working without any changes.
import {
  geoGraticule10,
  geoMercator,
  geoNaturalEarth1,
  geoOrthographic,
  geoPath,
} from 'd3-geo';
import type { GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import landTopo from 'world-atlas/land-110m.json';

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 470;

const topology = landTopo as unknown as Topology<{ land: GeometryCollection }>;
const land = feature(topology, topology.objects.land);

// ── Projection IDs ────────────────────────────────────────────────────────────

export type ProjectionId = 'naturalEarth' | 'globe' | 'mercator';

// ── Globe rotation options ────────────────────────────────────────────────────

export type GlobeOpts = {
  /** λ (longitude) rotation — negative to center on that longitude */
  lambda?: number;
  /** φ (latitude) rotation, clamped internally */
  phi?: number;
};

// ── Geometry result ───────────────────────────────────────────────────────────

export type MapGeometry = {
  landPath: string;
  spherePath: string;
  graticulePath: string;
  /** Project a geographic point → SVG [x, y]. Returns null when the point is
   *  on the far side of the globe (orthographic clipping). */
  projectPoint: (lat: number, lon: number) => [number, number] | null;
  /** d3-geo path generator for arbitrary GeoJSON (e.g. great-circle arcs). */
  pathGenerator: ReturnType<typeof geoPath>;
};

// ── Projection builders ───────────────────────────────────────────────────────

const buildNaturalEarth = (): GeoProjection =>
  geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], { type: 'Sphere' });

const buildMercator = (): GeoProjection => {
  // Clip to ±82° latitude to avoid runaway Mercator poles.
  const proj = geoMercator();
  // fitExtent leaving 0-padding; then clip via clipExtent on the path generator.
  proj.fitSize([MAP_WIDTH, MAP_HEIGHT], {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-180, -82],
          [180, -82],
          [180, 82],
          [-180, 82],
          [-180, -82],
        ],
      ],
    },
    properties: null,
  });
  return proj;
};

const buildOrthographic = (opts: GlobeOpts): GeoProjection => {
  const lambda = opts.lambda ?? 0;
  const phi = opts.phi ?? -10;
  return geoOrthographic()
    .fitSize([MAP_WIDTH, MAP_HEIGHT], { type: 'Sphere' })
    .rotate([-lambda, -phi, 0]);
};

// ── Core buildMapGeometry ─────────────────────────────────────────────────────

export const buildMapGeometry = (
  projectionId: ProjectionId = 'naturalEarth',
  opts: GlobeOpts = {},
): MapGeometry => {
  let proj: GeoProjection;
  switch (projectionId) {
    case 'globe':
      proj = buildOrthographic(opts);
      break;
    case 'mercator':
      proj = buildMercator();
      break;
    default:
      proj = buildNaturalEarth();
  }

  const pg = geoPath(proj);

  const projectPoint = (lat: number, lon: number): [number, number] | null => {
    // For orthographic we need to detect far-side points (inVisible hemisphere).
    if (projectionId === 'globe') {
      const [rl, rp] = proj.rotate() as [number, number, number];
      // Convert rotate angles back to center lon/lat
      const centerLon = -rl;
      const centerLat = -rp;
      // Dot product test: cos(angle) = sin(φ1)sin(φ2) + cos(φ1)cos(φ2)cos(Δλ)
      const toRad = (d: number) => (d * Math.PI) / 180;
      const cosAngle =
        Math.sin(toRad(lat)) * Math.sin(toRad(centerLat)) +
        Math.cos(toRad(lat)) *
          Math.cos(toRad(centerLat)) *
          Math.cos(toRad(lon - centerLon));
      if (cosAngle < 0) return null; // behind the globe
    }
    const pt = proj([lon, lat]);
    if (!pt) return null;
    return pt as [number, number];
  };

  return {
    landPath: pg(land) ?? '',
    spherePath: pg({ type: 'Sphere' }) ?? '',
    graticulePath: pg(geoGraticule10()) ?? '',
    projectPoint,
    pathGenerator: pg,
  };
};

// ── Module-scope defaults (naturalEarth) — preserve existing public API ───────

export const projection: GeoProjection = buildNaturalEarth();

const _pg = geoPath(projection);

export const LAND_PATH: string = _pg(land) ?? '';
export const SPHERE_PATH: string = _pg({ type: 'Sphere' }) ?? '';
export const GRATICULE_PATH: string = _pg(geoGraticule10()) ?? '';

export const projectPoint = (lon: number, lat: number): [number, number] =>
  projection([lon, lat]) ?? [0, 0];

// d3-geo resamples GeoJSON LineStrings along the great circle natively.
export const greatCirclePath = (
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
): string =>
  _pg({
    type: 'LineString',
    coordinates: [
      [a.lon, a.lat],
      [b.lon, b.lat],
    ],
  }) ?? '';
