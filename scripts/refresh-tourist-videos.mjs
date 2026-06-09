#!/usr/bin/env node
/**
 * Refresh the Fan Footage video list from Pexels Videos API and write
 * src/data/tourist-videos.json.
 *
 * Prerequisites (owner-granted; the script fails clearly without them):
 *   1. PEXELS_API_KEY present in the environment (add as a secret — never in chat).
 *   2. Host `api.pexels.com` on the environment's network allowlist.
 *
 * Usage:
 *   node scripts/refresh-tourist-videos.mjs
 *
 * Output: src/data/tourist-videos.json (pretty-printed, overwrites existing file).
 * Cap: ~12 videos sampled across host cities × topic queries (sports/travel only).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const OUT_FILE = 'src/data/tourist-videos.json';

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  fail(
    'Missing PEXELS_API_KEY.\n' +
      'Add it as an environment secret in your Claude Code environment settings ' +
      '(Variables) — do NOT paste the key into chat. Then re-run.\n' +
      'Get a free key at https://www.pexels.com/api/',
  );
}

// Host-city IDs from src/mocks/cities.ts, paired with representative city names
// used in Pexels search queries.
const HOST_CITIES = [
  { id: 'mexico-city',    name: 'Mexico City'  },
  { id: 'guadalajara',   name: 'Guadalajara'   },
  { id: 'monterrey',     name: 'Monterrey'     },
  { id: 'atlanta',       name: 'Atlanta'       },
  { id: 'boston',        name: 'Boston'        },
  { id: 'dallas',        name: 'Dallas'        },
  { id: 'houston',       name: 'Houston'       },
  { id: 'kansas-city',   name: 'Kansas City'   },
  { id: 'los-angeles',   name: 'Los Angeles'   },
  { id: 'miami',         name: 'Miami'         },
  { id: 'new-york',      name: 'New York'      },
  { id: 'philadelphia',  name: 'Philadelphia'  },
  { id: 'san-francisco', name: 'San Francisco' },
  { id: 'seattle',       name: 'Seattle'       },
  { id: 'toronto',       name: 'Toronto'       },
  { id: 'vancouver',     name: 'Vancouver'     },
];

// Sports/travel topic queries — content must stay on-topic (no unrelated footage).
const TOPICS = ['soccer fans', 'stadium crowd', 'city travel'];

// Rotate through ThumbnailKind values for visual variety.
const THUMBNAIL_KINDS = [
  'teal-to-turquoise',
  'grape-to-turquoise',
  'coral-to-gold',
  'citrus-to-teal',
];

// Total cap so we don't blast the free-tier rate limit.  We pick one city per
// topic query, cycling through the city list, until we reach MAX_VIDEOS.
const MAX_VIDEOS = 12;

/**
 * Call Pexels Videos search and return the raw response JSON.
 * @param {string} query
 * @returns {Promise<object>}
 */
async function searchPexels(query) {
  const url = new URL('https://api.pexels.com/videos/search');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '3');
  url.searchParams.set('orientation', 'portrait');

  const response = await fetch(url.toString(), {
    headers: { Authorization: API_KEY },
  }).catch((err) => {
    fail(
      `Network error reaching api.pexels.com: ${err.message}\n` +
        'Is api.pexels.com on the environment network allowlist ' +
        '(Network access → Custom, or Full)?',
    );
  });

  if (!response.ok) {
    fail(`Pexels API error ${response.status} for query "${query}": ${await response.text()}`);
  }

  return response.json();
}

/**
 * Pick the best (shortest portrait) mp4 file URL from a Pexels video object.
 * Falls back to the first file if none is portrait.
 * @param {object[]} videoFiles  video_files array from Pexels
 * @returns {string | null}
 */
function pickMp4(videoFiles) {
  const mp4s = videoFiles.filter((f) => f.file_type === 'video/mp4');
  if (!mp4s.length) return null;
  // Prefer portrait (height > width) for mobile-first display.
  const portrait = mp4s.filter((f) => f.height > f.width);
  const pool = portrait.length ? portrait : mp4s;
  // Pick the smallest file (lowest width) to keep load times short.
  return pool.sort((a, b) => a.width - b.width)[0].link;
}

/**
 * Map a Pexels video result to the TouristVideo shape.
 * @param {object} video    Pexels video object
 * @param {string} cityId
 * @param {string} query
 * @param {number} index    used to choose thumbnailKind
 * @returns {object}        TouristVideo
 */
function mapVideo(video, cityId, query, index) {
  const posterUrl = video.image ?? null;
  const videoUrl  = pickMp4(video.video_files ?? []);
  const author    = video.user?.name ?? null;
  const sourceUrl = video.url ?? '';

  return {
    id:              `pexels-${video.id}`,
    title:           video.alt ?? query,
    cityId:          cityId,
    query:           query,
    posterUrl:       posterUrl,
    videoUrl:        videoUrl,
    durationSeconds: video.duration ?? 0,
    sourceName:      'Pexels',
    sourceUrl:       sourceUrl,
    author:          author,
    thumbnailKind:   THUMBNAIL_KINDS[index % THUMBNAIL_KINDS.length],
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

const videos = [];
let cityIndex = 0;

outer: for (const topic of TOPICS) {
  for (; cityIndex < HOST_CITIES.length; cityIndex++) {
    if (videos.length >= MAX_VIDEOS) break outer;

    const city  = HOST_CITIES[cityIndex];
    const query = `${city.name} ${topic}`;

    console.log(`Fetching: "${query}" …`);
    const data = await searchPexels(query);

    for (const raw of data.videos ?? []) {
      if (videos.length >= MAX_VIDEOS) break outer;
      videos.push(mapVideo(raw, city.id, query, videos.length));
    }

    // Advance cityIndex so the next topic starts at the next city.
    cityIndex++;
    break;
  }
}

if (!videos.length) {
  fail('No videos returned from Pexels — check your API key and query terms.');
}

await mkdir(dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, JSON.stringify(videos, null, 2) + '\n');
console.log(`✓ Wrote ${videos.length} videos to ${OUT_FILE}.`);

// ── Helpers ─────────────────────────────────────────────────────────────────

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}
