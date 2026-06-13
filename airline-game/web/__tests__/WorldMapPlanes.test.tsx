/**
 * WorldMap plane glyphs and V3.6 animation tests
 */

import { render, screen } from '@testing-library/react';
import { WorldMap } from '@/components/WorldMap';
import type { Route, Competitor } from '@/types';

const noCompetitors: Competitor[] = [];

// Routes that connect known cities in the CITIES data
const makeRoute = (id: string, cityA: string, cityB: string): Route => ({
  id,
  cityA,
  cityB,
  distanceKm: 2000,
  aircraftIds: ['ac-1'],
  weeklyFlights: 7,
  fareMult: 1.0,
  cabinMix: { economy: 100, business: 0, first: 0 },
  serviceTier: 2,
  lastQuarter: null,
});

describe('WorldMap plane glyphs', () => {
  beforeEach(() => {
    // Default: no reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('1. plane glyphs render when routes are present', () => {
    const routes = [makeRoute('rt-1', 'nyc', 'lax')];
    render(
      <WorldMap
        hqCityId="nyc"
        routes={routes}
        competitors={noCompetitors}
        selectedCityId={null}
        onSelectCity={() => undefined}
      />,
    );
    const planes = screen.queryAllByTestId('plane-glyph');
    // 2 planes per route (forward + reverse)
    expect(planes.length).toBeGreaterThan(0);
    expect(planes.length).toBeLessThanOrEqual(12);
  });

  it('2. animateMotion is present on each plane glyph (when motion allowed)', () => {
    const routes = [makeRoute('rt-1', 'nyc', 'lax')];
    const { container } = render(
      <WorldMap
        hqCityId="nyc"
        routes={routes}
        competitors={noCompetitors}
        selectedCityId={null}
        onSelectCity={() => undefined}
      />,
    );
    const planes = screen.queryAllByTestId('plane-glyph');
    planes.forEach((plane) => {
      const motionEl = plane.querySelector('animateMotion');
      expect(motionEl).not.toBeNull();
    });
  });

  it('3. with prefers-reduced-motion: reduce, no animateMotion rendered', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const routes = [makeRoute('rt-1', 'nyc', 'lax')];
    render(
      <WorldMap
        hqCityId="nyc"
        routes={routes}
        competitors={noCompetitors}
        selectedCityId={null}
        onSelectCity={() => undefined}
      />,
    );
    const planes = screen.queryAllByTestId('plane-glyph');
    // Planes may still render but without animateMotion
    planes.forEach((plane) => {
      const motionEl = plane.querySelector('animateMotion');
      expect(motionEl).toBeNull();
    });
  });

  it('4. takeoff pulse circle renders for new routes', () => {
    const routes = [makeRoute('rt-1', 'nyc', 'lax')];
    const { container } = render(
      <WorldMap
        hqCityId="nyc"
        routes={routes}
        competitors={noCompetitors}
        selectedCityId={null}
        onSelectCity={() => undefined}
        newRouteIds={['rt-1']}
      />,
    );
    const pulseCircles = container.querySelectorAll('.takeoff-pulse-circle');
    expect(pulseCircles.length).toBeGreaterThan(0);
  });

  it('total planes capped at 12 even with many routes', () => {
    // Create 7 routes (which would be 14 planes without cap)
    const routes = [
      makeRoute('rt-1', 'nyc', 'lax'),
      makeRoute('rt-2', 'nyc', 'ord'),
      makeRoute('rt-3', 'nyc', 'lhr'),
      makeRoute('rt-4', 'nyc', 'cdg'),
      makeRoute('rt-5', 'nyc', 'hnd'),
      makeRoute('rt-6', 'nyc', 'dxb'),
      makeRoute('rt-7', 'nyc', 'pvg'),
    ];
    render(
      <WorldMap
        hqCityId="nyc"
        routes={routes}
        competitors={noCompetitors}
        selectedCityId={null}
        onSelectCity={() => undefined}
      />,
    );
    const planes = screen.queryAllByTestId('plane-glyph');
    expect(planes.length).toBeLessThanOrEqual(12);
  });

  it('no plane glyphs when no routes', () => {
    render(
      <WorldMap
        hqCityId="nyc"
        routes={[]}
        competitors={noCompetitors}
        selectedCityId={null}
        onSelectCity={() => undefined}
      />,
    );
    expect(screen.queryByTestId('plane-glyph')).not.toBeInTheDocument();
  });

  it('existing competitor arcs still render alongside plane glyphs', () => {
    const competitors: Competitor[] = [
      {
        id: 'ai-aurora',
        name: 'Aurora Pacific',
        nameZh: '极光太平洋航空',
        hqCityId: 'hnd',
        fareMult: 0.9,
        style: 'budget',
        routes: [{ cityA: 'hnd', cityB: 'pvg', weeklySeats: 2200 }],
        marketShare: 0.12,
      },
    ];
    const routes = [makeRoute('rt-1', 'nyc', 'lax')];
    render(
      <WorldMap
        hqCityId="nyc"
        routes={routes}
        competitors={competitors}
        selectedCityId={null}
        onSelectCity={() => undefined}
      />,
    );
    expect(screen.getByTestId('competitor-arc')).toBeInTheDocument();
    expect(screen.queryAllByTestId('plane-glyph').length).toBeGreaterThan(0);
  });
});
