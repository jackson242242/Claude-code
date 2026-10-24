#!/usr/bin/env node
/**
 * Ensure a playlist exists (by exact title) and add a video to it.
 * Uses the same OAuth env vars as youtube-upload.mjs.
 *
 * Usage:
 *   node scripts/youtube-playlist.mjs --title "中国美食 China Food" --video q6wX-LYDut8
 *
 * Idempotent-ish: reuses an existing playlist with the same title; adding a
 * video twice creates a duplicate entry, so callers should only add on upload.
 * Quota: playlists.insert ~50 units, playlistItems.insert ~50 units — negligible.
 */
const { YOUTUBE_CLIENT_ID: CID, YOUTUBE_CLIENT_SECRET: CSECRET, YOUTUBE_REFRESH_TOKEN: RTOKEN } = process.env;
if (!CID || !CSECRET || !RTOKEN) fail('Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN.');

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[i + 1];
}
if (!args.title || !args.video) fail('Usage: node scripts/youtube-playlist.mjs --title "<playlist title>" --video <videoId>');

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CID, client_secret: CSECRET, refresh_token: RTOKEN, grant_type: 'refresh_token' }),
});
const token = (await tokenRes.json()).access_token;
if (!token) fail('OAuth token refresh failed.');
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

// Find existing playlist by exact title (paginate up to 200).
let playlistId = null;
let pageToken = '';
do {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50&pageToken=${pageToken}`, { headers: H });
  const data = await res.json();
  if (!res.ok) fail(`playlists.list failed: ${JSON.stringify(data)}`);
  const hit = (data.items || []).find((p) => p.snippet.title === args.title);
  if (hit) { playlistId = hit.id; break; }
  pageToken = data.nextPageToken || '';
} while (pageToken);

if (!playlistId) {
  const res = await fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,status', {
    method: 'POST', headers: H,
    body: JSON.stringify({ snippet: { title: args.title }, status: { privacyStatus: 'public' } }),
  });
  const data = await res.json();
  if (!res.ok) fail(`playlists.insert failed: ${JSON.stringify(data)}`);
  playlistId = data.id;
  console.log(`Created playlist "${args.title}" (${playlistId})`);
}

const add = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
  method: 'POST', headers: H,
  body: JSON.stringify({ snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId: args.video } } }),
});
const added = await add.json();
if (!add.ok) fail(`playlistItems.insert failed: ${JSON.stringify(added)}`);
console.log(`Added ${args.video} -> "${args.title}" (${playlistId})`);

function fail(msg) { console.error(msg); process.exit(1); }
