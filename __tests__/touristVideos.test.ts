/**
 * Tests for the Fan Footage / Tourist Video pillar:
 *  - Seed data integrity (non-empty titles, valid thumbnailKind, deterministic)
 *  - getTouristVideos() returns the seed array when no API key is set
 */

import { SEED_TOURIST_VIDEOS } from '@/mocks/touristVideos';
import type { ThumbnailKind } from '@/types/touristVideo';

const VALID_THUMBNAIL_KINDS: ThumbnailKind[] = [
  'teal-to-turquoise',
  'grape-to-turquoise',
  'coral-to-gold',
  'citrus-to-teal',
];

// ---------------------------------------------------------------------------
// Seed integrity
// ---------------------------------------------------------------------------

describe('SEED_TOURIST_VIDEOS integrity', () => {
  it('has at least 8 entries', () => {
    expect(SEED_TOURIST_VIDEOS.length).toBeGreaterThanOrEqual(8);
  });

  it('every entry has a non-empty id', () => {
    SEED_TOURIST_VIDEOS.forEach((v) => {
      expect(v.id.trim()).not.toBe('');
    });
  });

  it('ids are unique', () => {
    const ids = SEED_TOURIST_VIDEOS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has a non-empty title', () => {
    SEED_TOURIST_VIDEOS.forEach((v) => {
      expect(v.title.trim()).not.toBe('');
    });
  });

  it('every entry has a valid thumbnailKind', () => {
    SEED_TOURIST_VIDEOS.forEach((v) => {
      expect(VALID_THUMBNAIL_KINDS).toContain(v.thumbnailKind);
    });
  });

  it('seed uses all four thumbnailKind values', () => {
    const usedKinds = new Set(SEED_TOURIST_VIDEOS.map((v) => v.thumbnailKind));
    VALID_THUMBNAIL_KINDS.forEach((kind) => {
      expect(usedKinds).toContain(kind);
    });
  });

  it('posterUrl is null for every seed entry (gradient placeholder mode)', () => {
    SEED_TOURIST_VIDEOS.forEach((v) => {
      expect(v.posterUrl).toBeNull();
    });
  });

  it('videoUrl is null for every seed entry (gradient placeholder mode)', () => {
    SEED_TOURIST_VIDEOS.forEach((v) => {
      expect(v.videoUrl).toBeNull();
    });
  });

  it('every entry has a positive durationSeconds', () => {
    SEED_TOURIST_VIDEOS.forEach((v) => {
      expect(v.durationSeconds).toBeGreaterThan(0);
    });
  });

  it('every entry has sourceName set to Matchday26', () => {
    SEED_TOURIST_VIDEOS.forEach((v) => {
      expect(v.sourceName).toBe('Matchday26');
    });
  });

  it('every entry has a non-empty sourceUrl', () => {
    SEED_TOURIST_VIDEOS.forEach((v) => {
      expect(v.sourceUrl.trim()).not.toBe('');
    });
  });

  it('every entry has a non-empty query', () => {
    SEED_TOURIST_VIDEOS.forEach((v) => {
      expect(v.query.trim()).not.toBe('');
    });
  });

  it('is deterministic — calling the array twice gives identical ids', () => {
    const first = SEED_TOURIST_VIDEOS.map((v) => v.id);
    const second = SEED_TOURIST_VIDEOS.map((v) => v.id);
    expect(first).toEqual(second);
  });

  it('all cityIds that are set correspond to real host city ids', () => {
    const HOST_CITY_IDS = new Set([
      'mexico-city',
      'guadalajara',
      'monterrey',
      'atlanta',
      'boston',
      'dallas',
      'houston',
      'kansas-city',
      'los-angeles',
      'miami',
      'new-york',
      'philadelphia',
      'san-francisco',
      'seattle',
      'toronto',
      'vancouver',
    ]);
    SEED_TOURIST_VIDEOS.forEach((v) => {
      if (v.cityId !== null) {
        expect(HOST_CITY_IDS).toContain(v.cityId);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// getTouristVideos — fallback to seed when PEXELS_API_KEY is absent
// ---------------------------------------------------------------------------

describe('getTouristVideos()', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Ensure no Pexels key is present so the service falls through to the cache
    delete process.env.PEXELS_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns a non-empty array when no PEXELS_API_KEY is set', async () => {
    const { getTouristVideos } = await import(
      '@/services/touristVideosService'
    );
    const videos = await getTouristVideos();
    expect(videos.length).toBeGreaterThan(0);
  });

  it('returns items with valid thumbnailKind when no PEXELS_API_KEY is set', async () => {
    const { getTouristVideos } = await import(
      '@/services/touristVideosService'
    );
    const videos = await getTouristVideos();
    videos.forEach((v) => {
      expect(VALID_THUMBNAIL_KINDS).toContain(v.thumbnailKind);
    });
  });

  it('returns items with non-empty titles when no PEXELS_API_KEY is set', async () => {
    const { getTouristVideos } = await import(
      '@/services/touristVideosService'
    );
    const videos = await getTouristVideos();
    videos.forEach((v) => {
      expect(v.title.trim()).not.toBe('');
    });
  });

  it('returns the seed array as ultimate fallback', async () => {
    // Mock the JSON cache import to throw so we confirm seed is the last resort
    jest.mock('@/data/tourist-videos.json', () => {
      throw new Error('simulated cache read failure');
    });

    const { getTouristVideos } = await import(
      '@/services/touristVideosService'
    );
    const videos = await getTouristVideos();

    // Should get at least the seed count
    expect(videos.length).toBeGreaterThanOrEqual(SEED_TOURIST_VIDEOS.length);
  });
});
