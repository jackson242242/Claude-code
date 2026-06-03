import { distanceKm, nearestCities } from '@/lib/geo';
import { MOCK_CITIES } from '@/mocks/cities';

describe('geo', () => {
  it('computes the great-circle distance (NY → LA ≈ 3,900 km)', () => {
    const distance = distanceKm(40.71, -74, 34.05, -118.24);
    expect(distance).toBeGreaterThan(3800);
    expect(distance).toBeLessThan(4100);
  });

  it('ranks Philadelphia as the nearest host city to New York', () => {
    const near = nearestCities(MOCK_CITIES, 'new-york', 3);
    expect(near).toHaveLength(3);
    expect(near[0].id).toBe('philadelphia');
    expect(near[0].distanceKm).toBeLessThanOrEqual(near[1].distanceKm);
  });

  it('returns nothing for an unknown city', () => {
    expect(nearestCities(MOCK_CITIES, 'atlantis')).toEqual([]);
  });
});
