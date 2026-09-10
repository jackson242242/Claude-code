#!/usr/bin/env node
/**
 * Ingest owner-supplied YouTube Audio Library tracks (owner 2026-09-10 chose
 * path A). Reads real title/artist from the file's tags, normalises loudness,
 * transcodes to 192k mp3, files it as yal-<slug>-NN.mp3, and records the real
 * credit in assets/music/manifest.json so every description can name the track
 * honestly (owner: "不tag流行音乐名字").
 *
 * Usage: node scripts/ingest-music.mjs --in <file-or-dir> [--mood upbeat|cinematic|calm|epic]
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, extname, basename } from 'node:path';

const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[i + 1];
if (!args.in) fail('Usage: node scripts/ingest-music.mjs --in <file-or-dir> [--mood upbeat|cinematic|calm|epic]');

const MUSIC_DIR = 'automation/youtube/assets/music';
const MANIFEST = join(MUSIC_DIR, 'manifest.json');
await mkdir(MUSIC_DIR, { recursive: true });

const AUDIO = new Set(['.mp3', '.m4a', '.wav', '.aac', '.ogg', '.flac']);
let files = [];
try {
  const entries = await readdir(args.in);
  files = entries.filter((f) => AUDIO.has(extname(f).toLowerCase())).map((f) => join(args.in, f));
} catch { files = [args.in]; }
if (!files.length) fail(`No audio files found at ${args.in}`);

let manifest = { note: 'Owner-supplied YouTube Audio Library tracks — credit these real names in descriptions. yal-* always outrank generated beds.', tracks: [] };
if (existsSync(MANIFEST)) manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));

const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'track';
const results = [];
for (const f of files) {
  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:format_tags=title,artist,album', '-of', 'json', f]));
  const tags = probe.format?.tags || {};
  const title = tags.title || basename(f, extname(f)).replace(/[_-]+/g, ' ').trim();
  const artist = tags.artist || 'YouTube Audio Library';
  const dur = Number(probe.format?.duration || 0);
  const mood = args.mood || 'mixed';
  const n = String(manifest.tracks.length + results.length + 1).padStart(2, '0');
  const out = join(MUSIC_DIR, `yal-${slug(title)}-${n}.mp3`);
  // loudnorm so beds sit consistently under cues; 192k keeps the repo light
  run('ffmpeg', ['-y', '-i', f, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-b:a', '192k', out]);
  results.push({ file: out.replace('automation/youtube/', ''), title, artist, mood, durationSec: Math.round(dur), source: 'YouTube Audio Library', addedAt: new Date().toISOString().slice(0, 10) });
  console.log(`+ ${out}  ← "${title}" — ${artist} (${Math.round(dur)}s)`);
}
manifest.tracks.push(...results);
await writeFile(MANIFEST, JSON.stringify(manifest, null, 1));
console.log(`\nmanifest: ${manifest.tracks.length} owner tracks. Credit line format:\n  🎵 Music: "<title>" — <artist> (YouTube Audio Library)`);

function run(bin, a) {
  try { return execFileSync(bin, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { fail(`${bin} failed:\n${(e.stderr || e.message).slice(0, 400)}`); }
}
function fail(m) { console.error(m); process.exit(1); }
