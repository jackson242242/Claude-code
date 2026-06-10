import {
  googleMapsDirectionsLink,
  resolveHostCity,
  rideshareLinksFor,
} from '@/lib/rideshare';

describe('resolveHostCity', () => {
  it('resolves by city id, exact name, and embedded name (case-insensitive)', () => {
    expect(resolveHostCity('mexico-city')?.name).toBe('Mexico City');
    expect(resolveHostCity('MEXICO CITY')?.name).toBe('Mexico City');
    expect(resolveHostCity('Estadio Azteca, Mexico City')?.name).toBe(
      'Mexico City',
    );
  });

  it('returns null for unknown or too-short input', () => {
    expect(resolveHostCity('Springfield')).toBeNull();
    expect(resolveHostCity('ny')).toBeNull();
  });
});

describe('rideshareLinksFor', () => {
  it('builds Uber + Lyft universal links anchored to the host city coords', () => {
    const links = rideshareLinksFor('Mexico City');
    expect(links).not.toBeNull();
    expect(links?.cityName).toBe('Mexico City');

    const uber = new URL(links!.uber);
    expect(uber.hostname).toBe('m.uber.com');
    expect(uber.searchParams.get('action')).toBe('setPickup');
    expect(uber.searchParams.get('pickup')).toBe('my_location');
    expect(uber.searchParams.get('dropoff[latitude]')).toBe('19.303');
    expect(uber.searchParams.get('dropoff[longitude]')).toBe('-99.15');

    const lyft = new URL(links!.lyft);
    expect(lyft.hostname).toBe('ride.lyft.com');
    expect(lyft.searchParams.get('destination[latitude]')).toBe('19.303');
  });

  it('returns null when the destination is not a host city', () => {
    expect(rideshareLinksFor('Springfield')).toBeNull();
  });
});

describe('googleMapsDirectionsLink', () => {
  it('maps transit modes and enriches host cities to "City, Country"', () => {
    const url = new URL(
      googleMapsDirectionsLink('Newark', 'mexico-city', 'train'),
    );
    expect(url.pathname).toBe('/maps/dir/');
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('travelmode')).toBe('transit');
    expect(url.searchParams.get('destination')).toBe('Mexico City, Mexico');
    // Free text that is not a host city passes through unchanged.
    expect(url.searchParams.get('origin')).toBe('Newark');
  });

  it('uses driving for rideshare and car rental', () => {
    expect(
      googleMapsDirectionsLink('a-place', 'b-place', 'rideshare'),
    ).toContain('travelmode=driving');
    expect(
      googleMapsDirectionsLink('a-place', 'b-place', 'car-rental'),
    ).toContain('travelmode=driving');
  });
});
