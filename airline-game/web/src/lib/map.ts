// World map geometry, computed once at module scope (CONTRACT §5: build the
// land paths from the npm `world-atlas` package — no runtime network fetch).
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo';
import type { GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import landTopo from 'world-atlas/land-110m.json';

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 470;

const topology = landTopo as unknown as Topology<{ land: GeometryCollection }>;
const land = feature(topology, topology.objects.land);

export const projection: GeoProjection = geoNaturalEarth1().fitSize(
  [MAP_WIDTH, MAP_HEIGHT],
  { type: 'Sphere' },
);

const pathGenerator = geoPath(projection);

export const LAND_PATH: string = pathGenerator(land) ?? '';
export const SPHERE_PATH: string = pathGenerator({ type: 'Sphere' }) ?? '';
export const GRATICULE_PATH: string = pathGenerator(geoGraticule10()) ?? '';

export const projectPoint = (lon: number, lat: number): [number, number] =>
  projection([lon, lat]) ?? [0, 0];

// d3-geo resamples GeoJSON LineStrings along the great circle natively.
export const greatCirclePath = (
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
): string =>
  pathGenerator({
    type: 'LineString',
    coordinates: [
      [a.lon, a.lat],
      [b.lon, b.lat],
    ],
  }) ?? '';
