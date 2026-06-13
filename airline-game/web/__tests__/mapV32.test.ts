/**
 * V3.2 — buildMapGeometry, projectPoint (globe far-side) tests.
 */

import { buildMapGeometry } from '@/lib/map';

describe('buildMapGeometry — all three projections return non-empty paths', () => {
  it('naturalEarth: returns non-empty landPath, spherePath, graticulePath', () => {
    const geo = buildMapGeometry('naturalEarth');
    expect(geo.landPath.length).toBeGreaterThan(0);
    expect(geo.spherePath.length).toBeGreaterThan(0);
    expect(geo.graticulePath.length).toBeGreaterThan(0);
  });

  it('globe: returns non-empty paths', () => {
    const geo = buildMapGeometry('globe', { lambda: 0, phi: 0 });
    expect(geo.landPath.length).toBeGreaterThan(0);
    expect(geo.spherePath.length).toBeGreaterThan(0);
    expect(geo.graticulePath.length).toBeGreaterThan(0);
  });

  it('mercator: returns non-empty paths', () => {
    const geo = buildMapGeometry('mercator');
    expect(geo.landPath.length).toBeGreaterThan(0);
    expect(geo.spherePath.length).toBeGreaterThan(0);
    expect(geo.graticulePath.length).toBeGreaterThan(0);
  });

  it('defaults to naturalEarth when called with no args', () => {
    const geo = buildMapGeometry();
    expect(geo.landPath.length).toBeGreaterThan(0);
  });
});

describe('projectPoint — globe far-side returns null', () => {
  it('returns [x,y] for a visible point (front hemisphere, lambda=0, phi=0)', () => {
    // Center on null-island (0,0); a nearby point (5°N, 5°E) should be visible
    const geo = buildMapGeometry('globe', { lambda: 0, phi: 0 });
    const result = geo.projectPoint(5, 5);
    expect(result).not.toBeNull();
    if (result) {
      expect(result[0]).toBeGreaterThan(0);
      expect(result[1]).toBeGreaterThan(0);
    }
  });

  it('returns null for a point on the far side of the globe', () => {
    // Center on 0°N, 0°E → far side is ~180° away, e.g. 0°N, 180°E (or -180°)
    const geo = buildMapGeometry('globe', { lambda: 0, phi: 0 });
    // 0°N, 179°E is on the opposite side
    const result = geo.projectPoint(0, 179);
    expect(result).toBeNull();
  });

  it('returns [x,y] (not null) for naturalEarth far side points', () => {
    // Natural Earth is not a globe — no far-side clipping
    const geo = buildMapGeometry('naturalEarth');
    const result = geo.projectPoint(0, 179);
    expect(result).not.toBeNull();
  });

  it('returns [x,y] (not null) for mercator far side points', () => {
    const geo = buildMapGeometry('mercator');
    const result = geo.projectPoint(0, 179);
    expect(result).not.toBeNull();
  });
});
