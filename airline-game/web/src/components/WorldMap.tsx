'use client';

import { useEffect, useMemo, useState } from 'react';
import { CITIES, CITY_BY_ID } from '@/lib/data';
import {
  GRATICULE_PATH,
  LAND_PATH,
  MAP_HEIGHT,
  MAP_WIDTH,
  SPHERE_PATH,
  greatCirclePath,
  projectPoint,
} from '@/lib/map';
import type { Competitor, Route } from '@/types';

type WorldMapProps = {
  hqCityId: string;
  routes: Route[];
  competitors: Competitor[];
  selectedCityId: string | null;
  onSelectCity: (cityId: string) => void;
  newRouteIds?: string[];
  fleetPulse?: boolean;
};

// Muted strokes for AI arcs — deliberately subdued next to the player's cyan.
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
}: WorldMapProps) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const cityPoints = useMemo(
    () =>
      CITIES.map((city) => ({
        city,
        point: projectPoint(city.lon, city.lat),
      })),
    [],
  );

  const competitorArcs = useMemo(
    () =>
      competitors.flatMap((competitor, competitorIndex) =>
        competitor.routes.flatMap((route, routeIndex) => {
          const a = CITY_BY_ID.get(route.cityA);
          const b = CITY_BY_ID.get(route.cityB);
          if (!a || !b) return [];
          return [
            {
              key: `${competitor.id}-${routeIndex}`,
              d: greatCirclePath(a, b),
              color: COMPETITOR_COLORS[competitorIndex % COMPETITOR_COLORS.length],
            },
          ];
        }),
      ),
    [competitors],
  );

  const routeArcs = useMemo(
    () =>
      routes.flatMap((route) => {
        const a = CITY_BY_ID.get(route.cityA);
        const b = CITY_BY_ID.get(route.cityB);
        if (!a || !b) return [];
        return [{ id: route.id, d: greatCirclePath(a, b), cityA: route.cityA }];
      }),
    [routes],
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
      // Forward plane
      if (glyphs.length < MAX_PLANES) {
        glyphs.push({
          key: `plane-${arc.id}-fwd`,
          pathId: `route-path-${arc.id}`,
          dur,
          keyPoints: '0;1',
        });
      }
      // Reverse plane
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
        const [x, y] = projectPoint(city.lon, city.lat);
        return { key: `pulse-${arc.id}`, x, y };
      })
      .filter((p): p is { key: string; x: number; y: number } => p !== null);
  }, [routeArcs, newRouteIds]);

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="img"
      aria-label="世界航线图"
      className={`h-full w-full${fleetPulse ? ' fleet-pulse' : ''}`}
      data-testid="world-map"
    >
      <defs>
        <radialGradient id="ocean" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor="#0a1626" />
          <stop offset="100%" stopColor="#04070f" />
        </radialGradient>
      </defs>

      <path d={SPHERE_PATH} fill="url(#ocean)" stroke="#16263f" strokeWidth={1} />
      <path d={GRATICULE_PATH} fill="none" stroke="#0e1a2e" strokeWidth={0.5} />
      <path d={LAND_PATH} fill="#101f36" stroke="#1f3354" strokeWidth={0.6} />

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
          <path id={`route-path-${arc.id}`} d={arc.d} className="route-arc-glow" />
          <path d={arc.d} className="route-arc" />
        </g>
      ))}

      {/* Plane glyphs — animated along route paths */}
      {planeGlyphs.map((glyph) => (
        <g key={glyph.key} data-testid="plane-glyph">
          <path
            d="M0,-3 L2,1 L0,0 L-2,1 Z"
            fill="#22d3ee"
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
          stroke="#22d3ee"
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
              <circle r={radius + 3.5} fill="none" stroke="#22d3ee" strokeWidth={1.2} />
            )}
            <circle
              className="dot"
              r={radius}
              fill={isHq ? '#fbbf24' : isSelected ? '#22d3ee' : '#7da7c4'}
              stroke={isHq ? '#fde68a' : '#0a1322'}
              strokeWidth={isHq ? 1.4 : 0.8}
            />
            <text
              y={-(radius + 4)}
              textAnchor="middle"
              fontSize={isHq || isSelected ? 11 : 9}
              fontWeight={isHq ? 700 : 500}
              fill={isHq ? '#fbbf24' : isSelected ? '#22d3ee' : '#5b7a96'}
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
