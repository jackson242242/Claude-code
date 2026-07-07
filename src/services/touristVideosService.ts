/**
 * Tourist Videos service — Fan Footage pillar.
 *
 * Behaviour (in priority order):
 *  1. PEXELS_API_KEY set → fetch live results from api.pexels.com for a
 *     curated query set (host cities × topic keywords), cap ~10 results,
 *     map to TouristVideo, revalidate every hour.
 *     NOTE: real clips require PEXELS_API_KEY to be set AND api.pexels.com
 *     to be allowlisted in the deployment environment; cannot be tested in
 *     a sandbox without that configuration.
 *  2. Error from Pexels, or key absent → read src/data/tourist-videos.json
 *     (refreshable cache file on disk).
 *  3. JSON read fails → return SEED_TOURIST_VIDEOS from src/mocks/touristVideos.ts.
 */

import type { TouristVideo, ThumbnailKind } from '@/types/touristVideo';
import { SEED_TOURIST_VIDEOS } from '@/mocks/touristVideos';

// ---------------------------------------------------------------------------
// Pexels API types (minimal — only the fields we use)
// ---------------------------------------------------------------------------

interface PexelsVideoFile {
  link: string;
  quality: string;
  file_type: string;
  width: number | null;
  height: number | null;
}

interface PexelsVideoUser {
  name: string;
  url: string;
}

interface PexelsVideo {
  id: number;
  url: string;
  image: string;
  duration: number;
  user: PexelsVideoUser;
  video_files: PexelsVideoFile[];
}

interface PexelsVideosResponse {
  videos: PexelsVideo[];
  total_results: number;
}

// ---------------------------------------------------------------------------
// Curated query set — host cities paired with relevant topic keywords
// ---------------------------------------------------------------------------

const CURATED_QUERIES: ReadonlyArray<{ cityId: string | null; term: string }> =
  [
    { cityId: 'mexico-city', term: 'soccer fans mexico city' },
    { cityId: 'miami', term: 'stadium crowd miami' },
    { cityId: 'los-angeles', term: 'soccer fans los angeles' },
    { cityId: 'toronto', term: 'toronto city travel' },
    { cityId: 'vancouver', term: 'vancouver city travel' },
    { cityId: null, term: 'soccer fans stadium crowd' },
    { cityId: null, term: 'world cup city travel' },
  ];

/** Cycle through the four allowed thumbnail gradient keys deterministically. */
const THUMBNAIL_CYCLE: ThumbnailKind[] = [
  'teal-to-turquoise',
  'grape-to-turquoise',
  'coral-to-gold',
  'citrus-to-teal',
];

const pickThumbnailKind = (index: number): ThumbnailKind =>
  THUMBNAIL_CYCLE[index % THUMBNAIL_CYCLE.length];

/**
 * From the available video files, prefer a short portrait mp4 (mobile-first),
 * falling back to any mp4, falling back to the first file's link.
 */
const pickVideoUrl = (files: PexelsVideoFile[]): string | null => {
  if (files.length === 0) return null;
  const mp4Files = files.filter((f) => f.file_type === 'video/mp4');
  // Prefer portrait (height > width) and SD quality to keep load light
  const portrait = mp4Files.find(
    (f) =>
      f.height !== null && f.width !== null && f.height > (f.width ?? 0),
  );
  if (portrait) return portrait.link;
  // Fall back to any sd mp4, then any mp4, then the first file
  const sd = mp4Files.find((f) => f.quality === 'sd');
  if (sd) return sd.link;
  if (mp4Files.length > 0) return mp4Files[0].link;
  return files[0].link;
};

const mapPexelsVideo = (
  video: PexelsVideo,
  cityId: string | null,
  term: string,
  index: number,
): TouristVideo => ({
  id: `pexels-${video.id}`,
  title: term
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' '),
  cityId,
  query: term,
  posterUrl: video.image,
  videoUrl: pickVideoUrl(video.video_files),
  durationSeconds: video.duration,
  sourceName: 'Pexels',
  sourceUrl: video.url,
  author: video.user.name,
  thumbnailKind: pickThumbnailKind(index),
});

// ---------------------------------------------------------------------------
// Pexels fetch — cap total results to ~10 across all queries
// ---------------------------------------------------------------------------

/** One Pexels search; failures are non-fatal and yield no videos. */
const searchPexels = async (
  key: string,
  term: string,
  params: string,
): Promise<PexelsVideo[]> => {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(term)}&${params}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: key },
      // Next.js 15 fetch cache hint — revalidate every hour
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) return [];
    const data = (await res.json()) as PexelsVideosResponse;
    return data.videos;
  } catch {
    return [];
  }
};

const fetchFromPexels = async (key: string): Promise<TouristVideo[]> => {
  const perQuery = 2; // 7 queries × 2 ≈ 14, capped down to ~10

  // All queries fire concurrently (they were awaited one-by-one before, which
  // made the home page block on up to 7 sequential Pexels round-trips); the
  // curated order is preserved when collecting results.
  const perQueryVideos = await Promise.all(
    CURATED_QUERIES.map(({ term }) =>
      searchPexels(key, term, `per_page=${perQuery}&orientation=portrait`),
    ),
  );

  const results: TouristVideo[] = [];
  for (const [queryIndex, videos] of perQueryVideos.entries()) {
    const { cityId, term } = CURATED_QUERIES[queryIndex];
    for (const video of videos) {
      if (results.length >= 10) return results;
      results.push(mapPexelsVideo(video, cityId, term, results.length));
    }
  }
  return results;
};

// ---------------------------------------------------------------------------
// JSON cache reader
// ---------------------------------------------------------------------------

const readJsonCache = async (): Promise<TouristVideo[]> => {
  // Dynamic import keeps this tree-shakeable on the client bundle
  const data = (await import('@/data/tourist-videos.json')) as {
    default: TouristVideo[];
  };
  return data.default;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the Fan Footage video list.
 *
 * Priority:
 *   Pexels live data (when PEXELS_API_KEY is set) →
 *   JSON cache (src/data/tourist-videos.json) →
 *   static seed (SEED_TOURIST_VIDEOS).
 */
export const getTouristVideos = async (): Promise<TouristVideo[]> => {
  const pexelsKey = process.env.PEXELS_API_KEY;

  if (pexelsKey) {
    try {
      const videos = await fetchFromPexels(pexelsKey);
      if (videos.length > 0) return videos;
    } catch {
      // Fall through to JSON cache
    }
  }

  try {
    return await readJsonCache();
  } catch {
    // Fall through to static seed
  }

  return SEED_TOURIST_VIDEOS;
};

// ---------------------------------------------------------------------------
// Hero background footage — landscape, football-action clips
// ---------------------------------------------------------------------------

/**
 * Curated, license-safe football-action queries for the cinematic hero
 * background. Evokes world-class / multi-nation energy (skills, training,
 * stadium nights, celebrations, fans) WITHOUT named-player match footage,
 * which is owned by FIFA/clubs/broadcasters and cannot be hosted.
 */
const HERO_QUERIES: readonly string[] = [
  'soccer player skills',
  'football training',
  'soccer stadium night',
  'football goal celebration',
  'soccer match',
  'football fans crowd',
];

/** Prefer a landscape mp4 around 720p to keep a background light. */
const pickLandscapeVideoUrl = (files: PexelsVideoFile[]): string | null => {
  if (files.length === 0) return null;
  const mp4 = files.filter((f) => f.file_type === 'video/mp4');
  const landscape = mp4.filter(
    (f) => f.width !== null && f.height !== null && (f.width ?? 0) >= (f.height ?? 0),
  );
  const pool = landscape.length > 0 ? landscape : mp4;
  const hd = pool.find((f) => (f.height ?? 0) >= 700 && (f.height ?? 0) <= 820);
  if (hd) return hd.link;
  const sd = pool.find((f) => f.quality === 'sd');
  if (sd) return sd.link;
  return pool[0]?.link ?? files[0].link;
};

const fetchHeroFromPexels = async (key: string): Promise<TouristVideo[]> => {
  // Same concurrency treatment as fetchFromPexels — 6 queries in parallel
  // instead of a sequential await chain.
  const perQueryVideos = await Promise.all(
    HERO_QUERIES.map((term) =>
      searchPexels(key, term, 'per_page=1&orientation=landscape&size=medium'),
    ),
  );

  const results: TouristVideo[] = [];
  for (const [queryIndex, videos] of perQueryVideos.entries()) {
    const term = HERO_QUERIES[queryIndex];
    for (const video of videos) {
      if (results.length >= 6) return results;
      const videoUrl = pickLandscapeVideoUrl(video.video_files);
      if (videoUrl == null) continue;
      results.push({
        id: `pexels-hero-${video.id}`,
        title: term
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        cityId: null,
        query: term,
        posterUrl: video.image,
        videoUrl,
        durationSeconds: video.duration,
        sourceName: 'Pexels',
        sourceUrl: video.url,
        author: video.user.name,
        thumbnailKind: pickThumbnailKind(results.length),
      });
    }
  }

  return results;
};

/**
 * Football-action footage for the cinematic hero background (landscape clips).
 * Returns live Pexels results when PEXELS_API_KEY is set; otherwise an empty
 * list so the hero honestly degrades to its gradient (no fake "live" footage).
 * Requires PEXELS_API_KEY set AND api.pexels.com allowlisted in the deployment.
 */
export const getHeroVideos = async (): Promise<TouristVideo[]> => {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  try {
    return await fetchHeroFromPexels(key);
  } catch {
    return [];
  }
};
