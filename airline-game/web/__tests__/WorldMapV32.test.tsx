/**
 * V3.2 — WorldMap theme and projection tests.
 */

import { render, screen } from '@testing-library/react';
import { WorldMap } from '@/components/WorldMap';
import type { Competitor } from '@/types';

const noCompetitors: Competitor[] = [];

const baseProps = {
  hqCityId: 'nyc',
  routes: [],
  competitors: noCompetitors,
  selectedCityId: null,
  onSelectCity: () => undefined,
};

describe('WorldMap — theme prop changes sea/ocean fill', () => {
  it('dark-ops theme: ocean gradient uses dark start color', () => {
    const { container } = render(
      <WorldMap {...baseProps} themeId="dark-ops" />,
    );
    // In SVG the stop-color attribute is the hyphen-case version
    const stops = container.querySelectorAll('radialGradient#ocean stop');
    expect(stops.length).toBeGreaterThanOrEqual(2);
    // dark-ops: sea starts at #0a1626
    const firstStop = stops[0] as SVGStopElement;
    // React renders it as stopColor in JSX but the DOM attr is stop-color
    const color = firstStop.getAttribute('stop-color') ?? firstStop.style.stopColor;
    expect(color).toBe('#0a1626');
  });

  it('light-day theme: ocean gradient uses light start color', () => {
    const { container } = render(
      <WorldMap {...baseProps} themeId="light-day" />,
    );
    const stops = container.querySelectorAll('radialGradient#ocean stop');
    expect(stops.length).toBeGreaterThanOrEqual(2);
    const firstStop = stops[0] as SVGStopElement;
    const color = firstStop.getAttribute('stop-color') ?? firstStop.style.stopColor;
    expect(color).toBe('#c8ddf0');
  });

  it('retro-chart theme: ocean gradient uses parchment start color', () => {
    const { container } = render(
      <WorldMap {...baseProps} themeId="retro-chart" />,
    );
    const stops = container.querySelectorAll('radialGradient#ocean stop');
    expect(stops.length).toBeGreaterThanOrEqual(2);
    const firstStop = stops[0] as SVGStopElement;
    const color = firstStop.getAttribute('stop-color') ?? firstStop.style.stopColor;
    expect(color).toBe('#e8d5b0');
  });

  it('data-theme attribute is set on the SVG element', () => {
    const { getByTestId } = render(
      <WorldMap {...baseProps} themeId="retro-chart" />,
    );
    expect(getByTestId('world-map').getAttribute('data-theme')).toBe('retro-chart');
  });

  it('defaults to dark-ops theme when no themeId provided', () => {
    const { getByTestId } = render(<WorldMap {...baseProps} />);
    expect(getByTestId('world-map').getAttribute('data-theme')).toBe('dark-ops');
  });
});

describe('WorldMap — projection prop', () => {
  it('renders map-sea path for naturalEarth projection', () => {
    const { getByTestId } = render(
      <WorldMap {...baseProps} projectionId="naturalEarth" />,
    );
    expect(getByTestId('map-sea').getAttribute('d')).toBeTruthy();
  });

  it('renders map-sea path for globe projection', () => {
    const { getByTestId } = render(
      <WorldMap {...baseProps} projectionId="globe" />,
    );
    expect(getByTestId('map-sea').getAttribute('d')).toBeTruthy();
  });

  it('renders map-sea path for mercator projection', () => {
    const { getByTestId } = render(
      <WorldMap {...baseProps} projectionId="mercator" />,
    );
    expect(getByTestId('map-sea').getAttribute('d')).toBeTruthy();
  });

  it('defaults to naturalEarth when no projectionId provided — no cursor-grab', () => {
    const { getByTestId } = render(<WorldMap {...baseProps} />);
    const svg = getByTestId('world-map');
    // SVG className is SVGAnimatedString — baseVal is the string; fall back to class attr
    const svgEl = svg as unknown as SVGSVGElement;
    const cls = svgEl.className?.baseVal ?? svg.getAttribute('class') ?? '';
    expect(cls).not.toMatch(/cursor-grab/);
  });

  it('globe projection adds cursor-grab class to SVG', () => {
    const { getByTestId } = render(
      <WorldMap {...baseProps} projectionId="globe" />,
    );
    const svg = getByTestId('world-map');
    const svgEl = svg as unknown as SVGSVGElement;
    const cls = svgEl.className?.baseVal ?? svg.getAttribute('class') ?? '';
    expect(cls).toMatch(/cursor-grab/);
  });
});
