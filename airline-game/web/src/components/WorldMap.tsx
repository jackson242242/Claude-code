'use client';

import { useEffect, useMemo, useState } from 'react';
import { CITIES, CITY_BY_ID } from '@/lib/data';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  buildMapGeometry,
} from '@/lib/map';
import type { ProjectionId } from '@/lib/map';
import { MAP_THEMES, DEFAULT_THEME } from '@/lib/mapTheme';
import type { MapThemeId } from '@/lib/mapTheme';
import { useGlobeRotation } from '@/hooks/useGlobeRotation';
import type { Competitor, Route } from '@/types';

export type { ProjectionId, MapThemeId };

type WorldMapProps = {
  hqCityId: string;
  routes: Route[];
  competitors: Competitor[];
  selectedCityId: string | null;
  onSelectCity: (cityId: string) => void;
  newRouteIds?: string[];
  fleetPulse?: boolean;
  projectionId?: ProjectionId;
  themeId?: MapThemeId;
};

// Muted strokes for AI arcs — deliberately subdued next to the player's accent.
const COMPETITOR_COLORS = ['#64748b', '#7c6f9f', '#5b8a8a'];

const MAX_PLANES = 12;

export const WorldMap = ({
  hqCityId,
  routes,
  competitors,
  selectedCityId,
  onSelectCity,
  newRouteIds = [],
  fleetPulse = false,
  projectionId = 'naturalEarth',
  themeId = DEFAULT_THEME,
}: WorldMapProps) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const theme = MAP_THEMES[themeId];

  // Globe rotation (only active in 'globe' projection)
  const hqCity = CITY_BY_ID.get(hqCityId);
  const initialLambda = hqCity?.lon ?? 0;
  const { rotation, onPointerDown, onPointerMove, onPointerUp, onPointerLeave } =
    useGlobeRotation(initialLambda, 0);

  // Build geometry — recomputes on rotation changes (globe only)
  const geo = useMemo(() => {
    if (projectionId === 'globe') {
      return buildMapGeometry('globe', {
        lambda: rotation.lambda,
        phi: rotation.phi,
      });
    }
    return buildMapGeometry(projectionId);
  }, [projectionId, rotation.lambda, rotation.phi]);

  const cityPoints = useMemo(
    () =>
      CITIES.map((city) => {
        const pt = geo.projectPoint(city.lat, city.lon);
        return { city, point: pt };
      }).filter((cp): cp is { city: typeof cp.city; point: [number, number] } => cp.point !== null),
    [geo],
  );

  const competitorArcs = useMemo(
    () =>
      competitors.flatMap((competitor, competitorIndex) =>
        competitor.routes.flatMap((route, routeIndex) => {
          const a = CITY_BY_ID.get(route.cityA);
          const b = CITY_BY_ID.get(route.cityB);
          if (!a || !b) return [];
          // Check both endpoints are visible (globe clipping)
          const ptA = geo.projectPoint(a.lat, a.lon);
          const ptB = geo.projectPoint(b.lat, b.lon);
          if (!ptA || !ptB) return [];
          const d = geo.pathGenerator({
            type: 'LineString',
            coordinates: [
              [a.lon, a.lat],
              [b.lon, b.lat],
            ],
          });
          if (!d) return [];
          return [
            {
              key: `${competitor.id}-${routeIndex}`,
              d,
              color: COMPETITOR_COLORS[competitorIndex % COMPETITOR_COLORS.length],
            },
          ];
        }),
      ),
    [competitors, geo],
  );

  const routeArcs = useMemo(
    () =>
      routes.flatMap((route) => {
        const a = CITY_BY_ID.get(route.cityA);
        const b = CITY_BY_ID.get(route.cityB);
        if (!a || !b) return [];
        // Skip arcs whose endpoints are hidden on globe
        const ptA = geo.projectPoint(a.lat, a.lon);
        const ptB = geo.projectPoint(b.lat, b.lon);
        if (!ptA || !ptB) return [];
        const d = geo.pathGenerator({
          type: 'LineString',
          coordinates: [
            [a.lon, a.lat],
            [b.lon, b.lat],
          ],
        });
        if (!d) return [];
        return [{ id: route.id, d, cityA: route.cityA }];
      }),
    [routes, geo],
  );

  // Build plane glyphs — cap at MAX_PLANES total
  const planeGlyphs = useMemo(() => {
    const glyphs: Array<{
      key: string;
      pathId: string;
      dur: string;
      keyPoints: string;
    }> = [];

    for (let i = 0; i < routeArcs.length && glyphs.length < MAX_PLANES; i++) {
      const arc = routeArcs[i];
      const dur = `${Math.min(8 + i * 2, 20)}s`;
      if (glyphs.length < MAX_PLANES) {
        glyphs.push({
          key: `plane-${arc.id}-fwd`,
          pathId: `route-path-${arc.id}`,
          dur,
          keyPoints: '0;1',
        });
      }
      if (glyphs.length < MAX_PLANES) {
        glyphs.push({
          key: `plane-${arc.id}-rev`,
          pathId: `route-path-${arc.id}`,
          dur,
          keyPoints: '1;0',
        });
      }
    }

    return glyphs;
  }, [routeArcs]);

  // Takeoff pulse origins for new routes
  const takeoffPulses = useMemo(() => {
    return routeArcs
      .filter((arc) => newRouteIds.includes(arc.id))
      .map((arc) => {
        const city = CITY_BY_ID.get(arc.cityA);
        if (!city) return null;
        const pt = geo.projectPoint(city.lat, city.lon);
        if (!pt) return null;
        const [x, y] = pt;
        return { key: `pulse-${arc.id}`, x, y };
      })
      .filter((p): p is { key: string; x: number; y: number } => p !== null);
  }, [routeArcs, newRouteIds, geo]);

  const isGlobe = projectionId === 'globe';

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="世界航线图"
      className={`h-full w-full${fleetPulse ? ' fleet-pulse' : ''}${isGlobe ? ' cursor-grab active:cursor-grabbing' : ''}`}
      data-testid="world-map"
      data-theme={themeId}
      onPointerDown={isGlobe ? onPointerDown : undefined}
      onPointerMove={isGlobe ? onPointerMove : undefined}
      onPointerUp={isGlobe ? onPointerUp : undefined}
      onPointerLeave={isGlobe ? onPointerLeave : undefined}
    >
      <defs>
        <radialGradient id="ocean" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor={theme.oceanGradStart} />
          <stop offset="100%" stopColor={theme.oceanGradEnd} />
        </radialGradient>
      </defs>

      <path
        d={geo.spherePath}
        fill={theme.seaFill}
        stroke={theme.seaStroke}
        strokeWidth={1}
        data-testid="map-sea"
      />
      <path
        d={geo.graticulePath}
        fill="none"
        stroke={theme.graticuleStroke}
        strokeWidth={0.5}
        strokeDasharray={theme.graticuleDash === 'none' ? undefined : theme.graticuleDash}
      />
      <path
        d={geo.landPath}
        fill={theme.landFill}
        stroke={theme.landStroke}
        strokeWidth={0.6}
      />

      {/* AI competitor routes — faded, static, painted before (= behind) player arcs */}
      {competitorArcs.map((arc) => (
        <path
          key={arc.key}
          d={arc.d}
          data-testid="competitor-arc"
          fill="none"
          stroke={arc.color}
          strokeWidth={0.9}
          strokeLinecap="round"
          opacity={0.35}
        />
      ))}

      {routeArcs.map((arc) => (
        <g key={arc.id}>
          {/* Named path for animateMotion mpath reference */}
          <path
            id={`route-path-${arc.id}`}
            d={arc.d}
            className="route-arc-glow"
            style={{ stroke: theme.routeColor }}
          />
          <path d={arc.d} className="route-arc" style={{ stroke: theme.routeColor }} />
        </g>
      ))}

      {/* Plane glyphs — animated along route paths */}
      {planeGlyphs.map((glyph) => (
        <g key={glyph.key} data-testid="plane-glyph">
          <path
            d="M0,-3 L2,1 L0,0 L-2,1 Z"
            fill={theme.routeColor}
            opacity={0.85}
          />
          {!reducedMotion && (
            <animateMotion
              dur={glyph.dur}
              repeatCount="indefinite"
              keyPoints={glyph.keyPoints}
              keyTimes="0;1"
              calcMode="linear"
              rotate="auto"
            >
              <mpath href={`#${glyph.pathId}`} />
            </animateMotion>
          )}
        </g>
      ))}

      {/* Takeoff pulse circles for new routes */}
      {takeoffPulses.map((pulse) => (
        <circle
          key={pulse.key}
          cx={pulse.x}
          cy={pulse.y}
          r={0}
          fill="none"
          stroke={theme.routeColor}
          strokeWidth={1.5}
          className="takeoff-pulse-circle"
        />
      ))}

      {cityPoints.map(({ city, point: [x, y] }) => {
        const isHq = city.id === hqCityId;
        const isSelected = city.id === selectedCityId;
        const radius = 2.4 + city.demandIndex * 0.22;
        return (
          <g
            key={city.id}
            className="city-node"
            transform={`translate(${x}, ${y})`}
            onClick={() => onSelectCity(city.id)}
            role="button"
            aria-label={`${city.nameZh}（${city.name}）`}
            data-testid={`city-${city.id}`}
          >
            {/* generous invisible touch target */}
            <circle r={13} fill="transparent" />
            {isHq && <circle className="hq-pulse" r={7} />}
            {isSelected && !isHq && (
              <circle
                r={radius + 3.5}
                fill="none"
                stroke={theme.selectedAccent}
                strokeWidth={1.2}
              />
            )}
            <circle
              className="dot"
              r={radius}
              fill={isHq ? theme.hqFill : isSelected ? theme.selectedAccent : theme.cityDotFill}
              stroke={isHq ? theme.hqFill : '#0a1322'}
              strokeWidth={isHq ? 1.4 : 0.8}
            />
            <text
              y={-(radius + 4)}
              textAnchor="middle"
              fontSize={isHq || isSelected ? 11 : 9}
              fontWeight={isHq ? 700 : 500}
              fill={
                isHq
                  ? theme.hqFill
                  : isSelected
                    ? theme.selectedAccent
                    : theme.cityLabelFill
              }
              style={{ pointerEvents: 'none' }}
            >
              {city.nameZh}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
