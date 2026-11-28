#!/usr/bin/env node
/**
 * Assemble a stock-footage video around a voiceover track:
 * Pexels b-roll clips + ffmpeg -> a finished 1080p MP4 (16:9 or 9:16 Short).
 *
 * Prerequisites (owner-granted; the script fails clearly without them):
 *   1. PEXELS_API_KEY present in the environment (free key: https://www.pexels.com/api/).
 *   2. Host `api.pexels.com` (and Pexels CDN `videos.pexels.com` / `player.vimeo.com`
 *      redirect targets served from `*.pexels.com`) on the network allowlist.
 *   3. ffmpeg installed (`apt-get update && apt-get install -y ffmpeg` in this container).
 *
 * Usage:
 *   node scripts/assemble-video.mjs \
 *     --audio runs/x/vo.mp3 --out runs/x/final.mp4 \
 *     --queries "university campus,students studying,library books" \
 *     [--format 16x9|9x16|1x1] [--title "Why Finland Rethinks Homework"] \
 *     [--seg-seconds 6] [--max-clips 10] [--srt subs.srt] \
 *     [--style default|riben] [--music bgm.mp3] \
 *     [--sub-style dynamic|plain] [--sfx pop|none] [--photos off|fill|only] \
 *     [--photo-motion kenburns|pov] [--orientation portrait|landscape|any] \
 *     [--clips clips.json] [--fit auto|crop|frame] [--keep-audio 0..1] [--music-volume 0..1]
 *
 * --photos (2026-09-26 nature pivot): Pexels PHOTO search as a footage lane.
 * Site-identifiable VIDEO exists for only ~8 Chinese landscapes, but photos
 * cover Zhangjiajie/Huangshan/Jiuzhaigou/Tianmen/… (plans/nature-pivot.md).
 * Each photo becomes a Ken-Burns segment (real zoom/pan, never a frozen frame).
 * fill = videos first, photos top up to --max-clips; only = photos exclusively.
 * Photo page URLs land in credits.json like clips, so the slug gate still works.
 * Photos are fetched from the Pexels original resized to 3200 px on the long
 * output axis (large2x is only ~867x1300 for portraits and was being upscaled).
 *
 * --photo-motion (2026-10-17, default kenburns = unchanged): pov = a forward
 * "walk-in" toward the path's vanishing point — one sub-pixel `perspective` pass
 * where the near ground (frame bottom) grows faster than the far scenery, plus a
 * handheld walking bob/sway/roll (preset pov6 from the 2026-10-17 stills test;
 * pov3 = the smooth variant, also accepted). No pixels are generated: it is a
 * camera move on a real licensed photo. Use it ONLY on photos with a path,
 * stairs, alley or boardwalk ahead (on a vista it is just a drone push-in), keep
 * it to 3-4 s, and put it between real clips — frozen people give it away after
 * ~2-3 s. Never caption it as "I walked"; numbers live in POV_PRESETS below.
 *
 * --clips <json> (2026-10-17): an explicit, ordered footage list that replaces the
 * --queries search, so frame 0 and every shot are chosen, not searched:
 *   [{ "id": "px-123456" | "pxp-123456" | "wm:File:Name.webm" | "file:/abs/path.mp4",
 *      "in": 0, "out": 5,          // source seconds; out defaults to in + --seg-seconds
 *      "cx": 0.5,                  // optional horizontal crop centre 0..1 (forces crop)
 *      "mute": [[1.2, 2.0]],       // optional SOURCE-second ranges to silence (shop/busker music)
 *      "label": "Dali Old Town",   // optional on-screen place chip for this shot
 *      "fit": "crop|frame",        // optional per-clip override of --fit
 *      "vp": [0.5, 0.45] }]        // optional vanishing point for pov photos
 *   px- = Pexels video (GET /videos/videos/<n>), pxp- = Pexels photo (GET /v1/photos/<n>),
 *   wm: = Wikimedia Commons file (MediaWiki API; only CC0 / public domain / CC BY,
 *   never YouTube-origin mirrors), file: = owner footage (sourceUrl "owner:<path>").
 *   Each entry is one segment of (out - in) seconds; the list is cycled (with a
 *   warning) if it is shorter than the target. Without --duration/--audio the
 *   target is the list's total length. --photos/--queries/--max-clips are ignored.
 *   cx / fit / vp are per entry (several entries may cut one source; one that
 *   omits cx / fit inherits that source's first entry).
 *   Labels are checked against the source slug / Commons title (slug gate): the
 *   whole label phrase must appear, or every word of it that is not a generic
 *   place word (old, town, mountain, lake, temple, great, west…), else a WARN.
 * --photo-motion pov guardrails are warned about (still at frame 0, still > 4 s,
 *   two stills back to back); the render goes ahead.
 * --fit auto|crop|frame: how a source whose aspect differs from the output fills it.
 *   crop = cover-crop around cx (default 0.5); frame = the whole shot scaled to fit
 *   over a blurred, darkened fill of itself; auto = same orientation -> crop,
 *   other orientation -> frame unless the clip sets cx (then crop); 1x1 -> crop.
 *   Default: auto with --clips or --orientation, otherwise the historical cover-crop.
 *   Photos are always cover-cropped (around cx when given).
 * --keep-audio <0..1>: mix each clip's own sound (ambient) at this gain under the
 *   music/VO; photos and silent clips contribute silence. Default 0 = clip audio dropped.
 *   Pexels files carry NO audio. Each ambient slice is measured; stdout then gets
 *   "ambient: full|partial|none (…)" and the output loudness in LUFS (WARN below
 *   -24). none + no --music/--audio = refused (would be silent); none + --music =
 *   ambient dropped and the music gain raised to at least 0.65 (MUSIC.md silent clip).
 * --music-volume <0..1>: music gain in subtitle-driven mode (default 0.85); in
 *   voiceover mode it replaces the 0.13 bed gain only when passed.
 * --orientation: Pexels search orientation in query mode (default portrait for
 *   9x16, landscape otherwise); any = no orientation filter.
 *
 * --sub-style dynamic (default when --srt is present): colored + animated burned
 * subtitles (STYLE.md v2.4) — white EN lead, gold ZH accent, coral number pops,
 * amber "★ Expert Tip" line, per-cue scale-bounce fade-in; long CJK lines auto-wrap.
 * A second cue line is styled as the gold ZH accent only when it contains CJK
 * characters; an English second line stays in the lead colour.
 * --sub-style plain reverts to the flat-white SRT burn.
 * --sfx pop (default when --srt is present): a soft synthesized "pop" on each cue's
 * entry (skips cue 1 so the 0-second hook is clean), mixed under the music bed.
 * --sfx none disables it. Both need no assets and add no external dependencies.
 *
 * --style riben: 日系唯美 grade — lifted milky blacks, muted saturation, teal-green
 * shadows + warm golden highlights (Shinkai-style split-tone; specs from the
 * 2026-07-09 style research). Pair with slower --seg-seconds (7-8).
 * --music: loops a background track under the voiceover at low volume (-18dB-ish),
 * second-pass mux so video encoding is untouched.
 *
 * --srt burns subtitles into the frame (bilingual cues supported: put both lines
 * in one cue). CJK text needs `apt-get install -y fonts-noto-cjk`; the SRT path
 * must not contain colons/commas (keep it inside the run folder).
 *
 * Also writes <out>.credits.json (source URLs per clip/photo) so the uploader can
 * append attribution to the video description. With --clips each entry also
 * carries id, license, CC BY attribution string, label and the output time
 * ranges ("at") where the source is on screen.
 *
 * The /tmp/assemble-* work folder is deleted after a successful run (KEEP_TMP=1
 * keeps it for debugging); a failed run leaves it in place.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { writeFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const args = parseArgs(process.argv.slice(2));
const CLIPS_FILE = args.clips || null;
if (CLIPS_FILE === 'true') fail('--clips needs a path to a JSON file');
const API_KEY = process.env.PEXELS_API_KEY;
// --clips lists that hold no Pexels ids do not need the key; the check moves to the first Pexels lookup.
if (!API_KEY && !CLIPS_FILE) fail('Missing PEXELS_API_KEY (environment secret). Free key: https://www.pexels.com/api/');

// --music also takes a bare bed name (playbook / meta.music style: "el-pov-walk-groove-01"
// or "lofi-chill-01.mp3"): when the value is not an existing file it is looked up in
// automation/youtube/assets/music/. Existing paths are used exactly as before.
if (typeof args.music === 'string' && !existsSync(args.music) && !args.music.includes('/')) {
  const musicDir = new URL('../automation/youtube/assets/music/', import.meta.url).pathname;
  const hit = [args.music, `${args.music}.mp3`].map((n) => join(musicDir, n)).find((p) => existsSync(p));
  if (hit) args.music = hit;
}
const audioFile = args.audio; // optional since 2026-07-10: subtitle-driven mode
const outFile = args.out;
const queries = (args.queries || '').split(',').map((q) => q.trim()).filter(Boolean);
const KEEP_AUDIO = args['keep-audio'] != null ? Number(args['keep-audio']) : 0;
if (!(KEEP_AUDIO >= 0 && KEEP_AUDIO <= 1)) fail(`--keep-audio must be a number from 0 to 1 (got "${args['keep-audio']}")`);
const MUSIC_VOL = args['music-volume'] != null ? Number(args['music-volume']) : 0.85;
if (!(MUSIC_VOL >= 0 && MUSIC_VOL <= 1)) fail(`--music-volume must be a number from 0 to 1 (got "${args['music-volume']}")`);
if (!outFile || (!CLIPS_FILE && queries.length === 0) ||
    (!audioFile && !((args.duration || CLIPS_FILE) && (args.music || KEEP_AUDIO > 0)))) {
  fail('Usage: node scripts/assemble-video.mjs --out <mp4> (--queries "a,b,c" | --clips clips.json) ' +
    '(--audio <vo.mp3> | --duration <sec> --music <bgm.mp3>) [--format 16x9|9x16|1x1] ' +
    '[--title "..."] [--srt subs.srt] [--style riben] [--music bgm.mp3] ' +
    '[--fit auto|crop|frame] [--keep-audio 0..1] [--music-volume 0..1] [--photo-motion kenburns|pov]\n' +
    'No --audio = subtitle-driven mode: music becomes the main track at full presence ' +
    '(--keep-audio > 0 may replace --music; --clips may replace --duration).');
}
const FORMATS = { '16x9': [1920, 1080], '9x16': [1080, 1920], '1x1': [1080, 1080] };
const fmtName = args.format || '16x9';
if (!FORMATS[fmtName]) fail(`Unknown --format "${fmtName}". Supported: ${Object.keys(FORMATS).join(', ')}`);
const [W, H] = FORMATS[fmtName];
const vertical = H > W;
const SEG = Number(args['seg-seconds'] || 6);
const MAX_CLIPS = Number(args['max-clips'] || 10);
// Subtitle look (owner 2026-08-24: "字幕改成彩色 + 字母动态效果 + 音效"):
//   dynamic = colored bilingual ASS (white EN lead + gold ZH accent + coral number
//             pops + amber Expert-Tip line) with a per-cue scale-bounce/fade-in;
//   plain   = the legacy flat-white burned SRT.
// Default: dynamic whenever an --srt is burned (that is the channel's Shorts look);
// pass --sub-style plain to force the old style.
const SUB_STYLE = (args['sub-style'] || (args.srt ? 'dynamic' : 'plain')).toLowerCase();
// Cue-synced sound design: a soft plucked "pop" laid on each subtitle's entry,
// mixed under the music bed. Default on for burned-subtitle videos; --sfx none off.
const SFX = (args.sfx || (args.srt ? 'pop' : 'none')).toLowerCase();
const PHOTOS = (args.photos || 'off').toLowerCase();
if (!['off', 'fill', 'only'].includes(PHOTOS)) fail(`Unknown --photos "${PHOTOS}". Supported: off, fill, only`);
const PHOTO_MOTION = (args['photo-motion'] || 'kenburns').toLowerCase();
if (!['kenburns', 'pov', 'pov3', 'pov6'].includes(PHOTO_MOTION)) fail(`Unknown --photo-motion "${PHOTO_MOTION}". Supported: kenburns, pov`);
const FIT = (args.fit || (CLIPS_FILE || args.orientation ? 'auto' : 'crop')).toLowerCase();
if (!['auto', 'crop', 'frame'].includes(FIT)) fail(`Unknown --fit "${FIT}". Supported: auto, crop, frame`);
const ORIENT = (args.orientation || (vertical ? 'portrait' : 'landscape')).toLowerCase();
if (!['portrait', 'landscape', 'any'].includes(ORIENT)) fail(`Unknown --orientation "${ORIENT}". Supported: portrait, landscape, any`);
// Probe sources (dims/audio) only on the new code paths; the legacy query path never probes.
const PROBE = !!(CLIPS_FILE || args.fit || args.orientation || KEEP_AUDIO > 0);
// Subtitle palette. Inline \c colours are 6-digit &HBBGGRR& (no alpha).
const C_WHITE = '&HFFFFFF&';   // EN lead
const C_GOLD = '&H00D7FF&';    // ZH accent (RGB 255,215,0)
const C_AMBER = '&H00A5FF&';   // Expert-Tip EN line (RGB 255,165,0)
const C_CORAL = '&H3C5AFF&';   // number pop (RGB 255,90,60)
const CJK_RE = /[⺀-鿿가-힯豈-﫿＀-￯]/;
const COMMONS_UA = 'CHINATRAVEL-assemble-video/1.1 (YouTube Shorts footage assembly; licensed sources only) node-fetch';

// POV still motion (--photo-motion pov). Port of the 2026-10-17 stills test
// (scratch pov-stills/bin/povfilter.mjs). Keystone dolly anchored at the path's
// vanishing point: the top corners (far scenery) zoom s0 -> sTop, the bottom
// corners (near ground) s0 -> sBot along a constant-walking-speed curve
// s0/(1-k t); plus a handheld signature: |sin| footfall bob (fraction of frame
// height) at `step` steps/s, sway (fraction of width) and roll (degrees) at stride
// rate, fine jitter. Tune here: bob 0.004-0.012, rollDeg 0.35-1.0. Keep sBot
// <= 1.5 (the 1.5x canvas means no upscaling) and s0 >= 1.04 (frame-edge margin).
// pov6 = the stills agent's pick (handheld); pov3 = its smooth variant (here with
// the footfall bob shape; the test used a plain sine bob for pov3).
const POV_PRESETS = {
  pov6: { s0: 1.08, sTop: 1.16, sBot: 1.5, bob: 0.009, sway: 0.006, rollDeg: 0.8, jitter: 0.0012, step: 1.8 },
  pov3: { s0: 1.04, sTop: 1.12, sBot: 1.5, bob: 0.004, sway: 0.0025, rollDeg: 0.35, jitter: 0, step: 1.8 },
};
const POV_DEFAULT = 'pov6';
const POV_VP = [0.5, 0.45]; // default vanishing point (x, y as fractions of the frame)
// --keep-audio checks: an ambient slice whose mean level is below the floor counts
// as silent; with no audible ambient at all the music is raised to the MUSIC.md
// silent-clip level; an output below QUIET_LUFS is warned about.
const AMBIENT_FLOOR_DB = -60;
const AMBIENT_SILENT_MUSIC = 0.65;
const QUIET_LUFS = -24;
// Label check (slug gate): words that name a kind of place, not a place. A label
// passes when its whole phrase is in the source slug/title, or when every word
// NOT in this list is; a label made only of these words must match as a phrase.
const GENERIC_PLACE_WORDS = new Set((
  'the and old new ancient town city village county district province region area scenic national park ' +
  'mountain mountains hill hills peak peaks cliff cliffs valley canyon gorge cave caves rock rocks stone forest ' +
  'lake lakes river rivers stream water waterfall waterfalls falls sea bay beach coast island islands spring springs ' +
  'desert dune dunes grassland glacier snow field fields rice terrace terraces tea garden gardens ' +
  'temple temples pagoda palace tower gate wall walls bridge square street streets road lane alley market food ' +
  'station train railway path trail stairs steps boardwalk view viewpoint ' +
  'great famous beautiful world heritage site china chinese ' +
  'north south east west central upper lower inner outer ' +
  'spring summer autumn fall winter morning evening night day sunrise sunset ' +
  'red yellow green blue white black golden silver rainbow').split(' '));

for (const bin of ['ffmpeg', 'ffprobe']) {
  try { execFileSync(bin, ['-version'], { stdio: 'ignore' }); }
  catch { fail(`${bin} not found. Install with: apt-get update && apt-get install -y ffmpeg`); }
}

let audioDur = audioFile
  ? Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioFile]))
  : Number(args.duration);
if (!CLIPS_FILE || audioFile || args.duration) {
  if (!audioDur || Number.isNaN(audioDur)) fail(audioFile ? `Could not read duration of ${audioFile}` : '--duration must be a number of seconds');
}
// Pace engine (owner 2026-07-17: "太慢，拖拉"): fast = hard cuts, no drift, no
// fade-in (the first frame IS the hook); slow = crossfades + Ken Burns (Sunday
// longform / heritage pieces only).
const FAST = (args.pace || 'fast') === 'fast';
const XFADE = FAST ? 0 : 0.45;
let nSegs = 0;
if (!CLIPS_FILE) {
  nSegs = Math.max(1, Math.ceil((audioDur + 1) / (SEG - XFADE)));
  process.stderr.write(`Audio ${audioDur.toFixed(1)}s -> ${nSegs} segment(s) of ~${SEG}s at ${W}x${H} (${FAST ? 'hard cuts' : 'crossfaded'})\n`);
}

// 1. Find candidate clips — Pexels always; Pixabay too when PIXABAY_API_KEY is
// set (both free-for-commercial-use, no attribution required; sources recorded
// in credits regardless). Square renders center-crop from landscape inventory.
const orientation = ORIENT;
const orientParam = orientation === 'any' ? '' : `&orientation=${orientation}`;
const PIXABAY_KEY = process.env.PIXABAY_API_KEY;
const clips = [];
const seen = new Set();

async function searchPexels(q) {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}${orientParam}&size=medium&per_page=6`,
    { headers: { Authorization: API_KEY } },
  );
  if (!res.ok) fail(`Pexels API error ${res.status} for "${q}": ${await res.text()}`);
  return ((await res.json()).videos || []).map((v) => {
    const file = pickFile(v.video_files);
    return file && { id: `px-${v.id}`, query: q, url: file.link, duration: v.duration, sourceUrl: v.url, photographer: v.user?.name || '', source: 'Pexels' };
  }).filter(Boolean);
}

async function searchPixabay(q) {
  const res = await fetch(`https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&per_page=6&safesearch=true`);
  if (!res.ok) { process.stderr.write(`Pixabay error ${res.status} for "${q}" — continuing with Pexels only\n`); return []; }
  return ((await res.json()).hits || []).map((v) => {
    // Prefer the smallest variant that still covers the target resolution.
    const variants = Object.values(v.videos || {}).filter((f) => f.url && Math.max(f.width || 0, f.height || 0) >= Math.max(W, H) * 0.9)
      .sort((a, b) => Math.max(a.width, a.height) - Math.max(b.width, b.height));
    const file = variants[0] || Object.values(v.videos || {}).sort((a, b) => Math.max(b.width || 0, b.height || 0) - Math.max(a.width || 0, a.height || 0))[0];
    return file && { id: `pb-${v.id}`, query: q, url: file.url, duration: v.duration, sourceUrl: v.pageURL, photographer: v.user || '', source: 'Pixabay' };
  }).filter(Boolean);
}

// Pexels `large2x` is a 940x650 box at 2x (867x1300 for portraits), so stills were
// upscaled ~1.85x. The original resized to 3200 px on the output's long axis
// (fm=jpg keeps PNG originals ~1 MB) covers the 1.5x pov canvas without upscaling.
function photoLink(p) {
  if (!p.src?.original) return p.src?.large2x;
  const u = new URL(p.src.original);
  for (const [k, v] of [['auto', 'compress'], ['cs', 'tinysrgb'], ['fm', 'jpg'], [vertical ? 'h' : 'w', '3200']]) u.searchParams.set(k, v);
  return u.toString();
}

async function searchPexelsPhotos(q) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}${orientParam}&size=large&per_page=6`,
    { headers: { Authorization: API_KEY } },
  );
  if (!res.ok) fail(`Pexels photo API error ${res.status} for "${q}": ${await res.text()}`);
  return ((await res.json()).photos || []).map((p) => {
    const link = photoLink(p);
    return link && { id: `pxp-${p.id}`, kind: 'photo', query: q, url: link, duration: SEG, sourceUrl: p.url, photographer: p.photographer || '', source: 'Pexels' };
  }).filter(Boolean);
}

let entries = []; // --clips: one normalized entry per segment slot, in order
if (!CLIPS_FILE) {
  if (PHOTOS !== 'only') {
    for (const q of queries) {
      const found = [...(await searchPexels(q)), ...(PIXABAY_KEY ? await searchPixabay(q) : [])];
      for (const c of found) {
        if (seen.has(c.id) || clips.length >= MAX_CLIPS) continue;
        seen.add(c.id);
        clips.push(c);
      }
    }
  }
  if (PHOTOS !== 'off') {
    for (const q of queries) {
      for (const c of await searchPexelsPhotos(q)) {
        if (seen.has(c.id) || clips.length >= MAX_CLIPS) continue;
        seen.add(c.id);
        clips.push(c);
      }
    }
  }
  if (clips.length === 0) fail('No usable clips found for the given queries.');
  process.stderr.write(`Using ${clips.length} unique clip(s) (${clips.filter((c) => c.source === 'Pixabay').length} from Pixabay, ${clips.filter((c) => c.kind === 'photo').length} photos)\n`);
} else {
  if (!existsSync(CLIPS_FILE)) fail(`--clips file not found: ${CLIPS_FILE}`);
  let list;
  try { list = JSON.parse(await readFile(CLIPS_FILE, 'utf8')); } catch (e) { fail(`--clips ${CLIPS_FILE} is not valid JSON: ${e.message}`); }
  if (list && !Array.isArray(list) && Array.isArray(list.clips)) list = list.clips;
  if (!Array.isArray(list) || list.length === 0) fail(`--clips ${CLIPS_FILE} must be a non-empty JSON array of { "id": ... } entries`);
  const byId = new Map();
  for (let k = 0; k < list.length; k++) {
    const e = list[k];
    if (!e || typeof e.id !== 'string' || !e.id.trim()) fail(`--clips entry ${k}: missing "id"`);
    const id = e.id.trim();
    if (e.cx != null && !(Number(e.cx) >= 0 && Number(e.cx) <= 1)) fail(`--clips entry ${k} (${id}): cx must be 0..1`);
    if (e.fit != null && !['auto', 'crop', 'frame'].includes(String(e.fit))) fail(`--clips entry ${k} (${id}): fit must be auto|crop|frame`);
    if (!byId.has(id)) {
      const c = await resolveClipId(id, k);
      // cx / fit are per entry; an entry that omits them inherits the first entry
      // of the same source. `uses` lets the download pick one rendition that is
      // big enough for the most demanding fit any entry asks for.
      c.cx = e.cx != null ? Number(e.cx) : null;
      c.fit = e.fit || null;
      c.uses = [];
      byId.set(id, c);
      clips.push(c);
    }
    const c = byId.get(id);
    c.uses.push({ cx: e.cx != null ? Number(e.cx) : c.cx, fit: e.fit || c.fit });
    entries.push({ clip: c, raw: e, k });
  }
  process.stderr.write(`Using ${clips.length} source(s) from --clips (${clips.filter((c) => c.kind === 'photo').length} photos, ${clips.filter((c) => c.source === 'Wikimedia Commons').length} Commons, ${clips.filter((c) => c.source === 'Owner').length} owner)\n`);
}

// 2. Download and normalize each needed segment (cycle clips if fewer than segments).
const tmp = await mkdtemp(join(tmpdir(), 'assemble-'));
const downloaded = new Map();

async function ensureLocal(clip) {
  if (downloaded.has(clip.id)) return downloaded.get(clip.id);
  let raw;
  if (clip.localPath) {
    raw = clip.localPath;
  } else {
    if (clip.renditions) {
      // --clips video: choose the rendition before downloading — crop (both axes
      // covered) when any entry of this source crops, else frame (one axis).
      const modes = (clip.uses || [clip]).map((u) => resolveFit({ ...clip, cx: u.cx, fit: u.fit }));
      const r = pickRendition(clip.renditions, modes.includes('crop') ? 'crop' : 'frame');
      if (!r) fail(`No downloadable rendition for ${clip.id}`);
      clip.url = r.url;
    }
    raw = join(tmp, clip.kind === 'photo' ? `photo-${clip.id.replace(/[^\w.-]/g, '_')}.jpg` : `clip-${clip.id.replace(/[^\w.-]/g, '_')}.mp4`);
    const res = clip.source === 'Wikimedia Commons' ? await fetchCommons(clip.url, clip.id) : await fetch(clip.url);
    if (!res.ok) fail(`Failed to download clip ${clip.id}: HTTP ${res.status}`);
    await writeFile(raw, Buffer.from(await res.arrayBuffer()));
  }
  if (PROBE) {
    const p = probe(raw);
    if (p.w && p.h) { clip.w = p.w; clip.h = p.h; }
    if (clip.kind !== 'photo' && p.duration) clip.duration = p.duration;
    clip.hasAudio = clip.kind !== 'photo' && p.hasAudio;
    clip.fitMode = resolveFit(clip);
  }
  downloaded.set(clip.id, raw);
  return raw;
}

// Segment plan: [{ clip, start, segLen, ... }]. Query mode keeps the historical
// cycling exactly; --clips turns each entry into one segment of its own length.
const plan = [];
if (!CLIPS_FILE) {
  for (let i = 0; i < nSegs; i++) {
    const clip = clips[i % clips.length];
    const segLen = SEG; // -shortest trims trailing excess against the voiceover
    // Reuse of the same clip in a later cycle starts deeper into the clip for variety.
    const start = Math.min(Math.floor(i / clips.length) * SEG, Math.max(0, (clip.duration || SEG) - segLen));
    plan.push({ clip, start, segLen });
  }
} else {
  for (const c of clips) await ensureLocal(c);
  const slots = entries.map(normalizeEntry);
  const cover = (segs) => segs.reduce((s, x) => s + x.segLen, 0) - Math.max(0, segs.length - 1) * XFADE;
  if (!audioFile && !args.duration) audioDur = Math.floor(cover(slots) * 100) / 100;
  if (!audioDur || audioDur < 0.5) fail('--clips: total length is too short');
  let cycled = false;
  while (cover(plan) < audioDur - 1e-6) {
    for (const s of slots) {
      if (plan.length && cover(plan) >= audioDur - 1e-6) break;
      plan.push({ ...s });
    }
    if (cover(plan) < audioDur - 1e-6) cycled = true;
  }
  if (cycled) process.stderr.write(`WARN: --clips total ${cover(slots).toFixed(2)}s < target ${audioDur.toFixed(2)}s — cycling the list (footage repeats)\n`);
  process.stderr.write(`Target ${audioDur.toFixed(1)}s -> ${plan.length} segment(s) from --clips at ${W}x${H} (${FAST ? 'hard cuts' : 'crossfaded'})\n`);
}

// --photo-motion pov guardrails (playbook 0c.4): warn, the routine decides.
if (PHOTO_MOTION !== 'kenburns') {
  const pov = plan.map((p, i) => (p.clip.kind === 'photo' ? i : -1)).filter((i) => i >= 0);
  const segs = (ix) => ix.map((i) => `#${i + 1}`).join(', ');
  if (pov[0] === 0) process.stderr.write('WARN: pov still at frame 0 (playbook: never — open on a real clip)\n');
  const long = pov.filter((i) => plan[i].segLen > 4 + 1e-6);
  if (long.length) process.stderr.write(`WARN: pov still longer than 4 s in segment ${segs(long)} (playbook: 3-4 s; frozen people give it away)\n`);
  const adj = pov.filter((i) => plan[i + 1]?.clip.kind === 'photo');
  if (adj.length) process.stderr.write(`WARN: pov still followed by another still after segment ${segs(adj)} (playbook: one still between real clips)\n`);
}

// --keep-audio: know which sources have sound before rendering. Query mode
// downloads lazily, so fetch its planned clips first (same order, same files).
if (KEEP_AUDIO > 0) {
  for (const p of plan) await ensureLocal(p.clip);
  if (!audioFile && !args.music && !plan.some((p) => p.clip.kind !== 'photo' && p.clip.hasAudio)) {
    fail('--keep-audio: none of the sources has an audio stream and no --music was given; the output would be silent');
  }
}

const segFiles = [];
const audioSegs = [];
const segStarts = []; // output-timeline start of each segment (labels, credits "at")
const ambientHeard = []; // per segment: does its ambient slice carry audible sound?
let tl = 0;
for (let i = 0; i < plan.length; i++) {
  const { start, segLen } = plan[i];
  const raw = await ensureLocal(plan[i].clip);
  // --clips: this entry's own cx / fit on the shared source (query mode: the clip as is).
  const clip = CLIPS_FILE ? entryView(plan[i]) : plan[i].clip;
  segStarts.push(tl);
  tl += segLen - XFADE;
  const nFrames = Math.round(segLen * 30);
  // Legacy segments stay time-bounded exactly as before; --clips segments are
  // frame-exact so per-clip lengths and the ambient bed line up across concat.
  const lenArgs = CLIPS_FILE ? ['-frames:v', String(nFrames)] : ['-t', segLen.toFixed(2)];
  // Pad short sources (clone the last frame) so a video segment is never shorter
  // than its ambient slice. Query mode only pads on the --keep-audio path, so the
  // legacy ffmpeg arguments stay identical.
  const padV = CLIPS_FILE ? ',tpad=stop_mode=clone:stop_duration=1'
    : KEEP_AUDIO > 0 ? `,tpad=stop_mode=clone:stop_duration=${segLen.toFixed(2)}` : '';
  const seg = join(tmp, `seg-${String(i).padStart(3, '0')}.mp4`);
  if (clip.kind === 'photo') {
    const cropAt = clip.cx != null ? `:x='(iw-ow)*${clip.cx}':y='(ih-oh)/2'` : '';
    if (PHOTO_MOTION !== 'kenburns') {
      const preset = POV_PRESETS[PHOTO_MOTION === 'pov' ? POV_DEFAULT : PHOTO_MOTION];
      run('ffmpeg', ['-y', '-i', raw, '-vf', povFilter(segLen, i, preset, plan[i].vp || POV_VP, cropAt),
        ...lenArgs, '-r', '30', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', seg]);
    } else {
      // Still → motion: a single frame drives zoompan for the whole segment.
      // Alternate a centred push-in with a lateral pan at fixed zoom so
      // consecutive stills never move the same way; overscan 1.25× so the pan
      // has room and nothing is upscaled at zoom 1.0.
      const frames = Math.round(segLen * 30);
      const W2 = Math.ceil((W * 1.25) / 2) * 2;
      const H2 = Math.ceil((H * 1.25) / 2) * 2;
      const zp = i % 2 === 0
        ? `zoompan=z='1+0.12*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=30`
        : `zoompan=z='1.12':x='(iw-iw/zoom)*${(Math.floor(i / 2) % 2 === 0) ? `on/${frames}` : `(1-on/${frames})`}':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=30`;
      run('ffmpeg', ['-y', '-i', raw,
        '-vf', `scale=${W2}:${H2}:force_original_aspect_ratio=increase,crop=${W2}:${H2}${cropAt},${zp},format=yuv420p`,
        ...lenArgs, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', seg]);
    }
  } else if (FAST) {
    // Crisp: straight cover-crop, rely on the footage's own motion (queries
    // demand people/action shots) — uniform drift on every shot reads sleepy.
    run('ffmpeg', ['-y', '-ss', String(start), '-i', raw, ...lenArgs,
      '-vf', `${fitChain(clip, W, H)},fps=30${padV},format=yuv420p`,
      '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', seg]);
  } else {
    // Gentle Ken Burns drift for slow-cinema pieces.
    const W2 = Math.ceil((W * 1.12) / 2) * 2;
    const H2 = Math.ceil((H * 1.12) / 2) * 2;
    const drift = i % 2 === 0 ? `(in_w-out_w)*(t/${segLen})` : `(in_w-out_w)*(1-t/${segLen})`;
    run('ffmpeg', ['-y', '-ss', String(start), '-i', raw, ...lenArgs,
      '-vf', `${fitChain(clip, W2, H2)},fps=30${padV},crop=${W}:${H}:x='${drift}':y='(in_h-out_h)/2',format=yuv420p`,
      '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', seg]);
  }
  segFiles.push(seg);
  if (KEEP_AUDIO > 0) {
    // Ambient bed: the same in..out range of the clip's own sound, sample-exact,
    // with per-clip mute ranges (source seconds) silenced; photos/silent clips = silence.
    const aseg = join(tmp, `aseg-${String(i).padStart(3, '0')}.wav`);
    // Match the video segment's real frame count (-t T at 30 fps keeps ceil(T*30) frames).
    const vFrames = CLIPS_FILE ? nFrames : Math.ceil(segLen * 30 - 1e-6);
    const nSamples = Math.round((vFrames / 30) * 48000);
    const pcm = ['-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le'];
    if (clip.kind === 'photo' || !clip.hasAudio) {
      run('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-af', `atrim=end_sample=${nSamples}`, ...pcm, aseg]);
      ambientHeard.push(false);
    } else {
      const mutes = (plan[i].mute || []).map(([a, b]) => [a - start, b - start]).filter(([, b]) => b > 0)
        .map(([a, b]) => `volume=0:enable='between(t,${Math.max(0, a).toFixed(3)},${b.toFixed(3)})'`);
      const af = [...mutes, 'aresample=48000', 'aformat=sample_fmts=s16:channel_layouts=stereo',
        `apad=whole_len=${nSamples}`, `atrim=end_sample=${nSamples}`].join(',');
      run('ffmpeg', ['-y', '-ss', String(start), '-i', raw, '-vn', '-af', af, ...pcm, aseg]);
      // An audio stream can still be digital silence (or fully muted): measure it.
      ambientHeard.push(meanVolumeDb(aseg) > AMBIENT_FLOOR_DB);
    }
    audioSegs.push(aseg);
  }
}

// --keep-audio outcome: full / partial / none (seconds of planned footage whose
// ambient slice is audible). Pexels files carry no audio, so "none" is common:
// a music-less render would be silent (refuse), and a bed set low for ambient
// (F2: 0.35) would leave the Short quiet, so raise it to the silent-clip level.
let musicGain = MUSIC_VOL;
let ambientNote = null;
if (KEEP_AUDIO > 0) {
  const total = plan.reduce((s, p) => s + p.segLen, 0);
  const heard = plan.reduce((s, p, i) => s + (ambientHeard[i] ? p.segLen : 0), 0);
  const state = heard <= 0 ? 'none' : heard >= total - 1e-6 ? 'full' : 'partial';
  ambientNote = `ambient: ${state} (${heard.toFixed(1)}/${total.toFixed(1)} s of footage with source sound)`;
  if (state === 'none') {
    if (!audioFile && !args.music) fail('--keep-audio: no source has audible sound (no audio stream, digital silence or fully muted) and no --music was given; the output would be silent');
    if (!audioFile) {
      musicGain = Math.max(MUSIC_VOL, AMBIENT_SILENT_MUSIC);
      process.stderr.write(`WARN: ambient silent (no source has audible sound) — ${musicGain > MUSIC_VOL
        ? `music gain raised from ${MUSIC_VOL} to ${musicGain} (MUSIC.md: silent clip 0.6-0.7)` : `music stays at ${MUSIC_VOL}`}; ambient bed dropped\n`);
    } else {
      process.stderr.write('WARN: ambient silent (no source has audible sound) — ambient bed dropped; voiceover and music unchanged\n');
    }
    audioSegs.length = 0; // no ambient input: the plain music (or VO) path renders
  } else if (state === 'partial') {
    process.stderr.write(`WARN: ${ambientNote} — the rest has music only${args.music ? ` at ${MUSIC_VOL}` : ' (no --music: silent there)'}\n`);
  }
}

// 3. Join segments into one silent reel: hard cuts (concat) in fast mode,
// crossfade chain in slow mode. Then mux audio (+ overlays).
const silent = join(tmp, 'silent.mp4');
if (segFiles.length === 1) {
  run('ffmpeg', ['-y', '-i', segFiles[0], '-c', 'copy', silent]);
} else if (FAST) {
  const listFile = join(tmp, 'list.txt');
  await writeFile(listFile, segFiles.map((f) => `file '${f}'`).join('\n'));
  run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', silent]);
} else {
  const durs = segFiles.map((f) => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f])));
  const inputs = segFiles.flatMap((f) => ['-i', f]);
  let chain = '';
  let prev = '0:v';
  let offset = 0;
  for (let i = 1; i < segFiles.length; i++) {
    offset += durs[i - 1] - XFADE;
    const out = i === segFiles.length - 1 ? 'vout' : `v${i}`;
    chain += `[${prev}][${i}:v]xfade=transition=fade:duration=${XFADE}:offset=${offset.toFixed(2)}[${out}];`;
    prev = out;
  }
  run('ffmpeg', ['-y', ...inputs, '-filter_complex', chain.slice(0, -1), '-map', '[vout]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', silent]);
}
// Ambient bed joined the same way (hard cuts = concat, slow = matching acrossfades).
let ambient = null;
if (audioSegs.length) {
  ambient = join(tmp, 'ambient.wav');
  if (audioSegs.length === 1 || FAST) {
    const aList = join(tmp, 'alist.txt');
    await writeFile(aList, audioSegs.map((f) => `file '${f}'`).join('\n'));
    run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', aList, '-c', 'copy', ambient]);
  } else {
    let chain = '';
    let prev = '0:a';
    for (let i = 1; i < audioSegs.length; i++) {
      const out = i === audioSegs.length - 1 ? 'aout' : `a${i}`;
      chain += `[${prev}][${i}:a]acrossfade=d=${XFADE}[${out}];`;
      prev = out;
    }
    run('ffmpeg', ['-y', ...audioSegs.flatMap((f) => ['-i', f]), '-filter_complex', chain.slice(0, -1),
      '-map', '[aout]', '-c:a', 'pcm_s16le', ambient]);
  }
}

// Cinematic grade first, overlays next, fade appended last (after subtitles).
// 'riben' = Japanese-aesthetic split-tone: lifted blacks, muted sat, cool shadows,
// warm highlights. 'default' = the original punchy grade.
const GRADES = {
  default: 'eq=contrast=1.05:saturation=1.12:brightness=0.01',
  // legacy riben (v1): warm-highlight push reads YELLOW on already-warm footage
  // (owner 2026-07-17: "contrast 好黄") — kept for reference, not for new videos.
  riben: 'eq=brightness=0.05:contrast=1.15:saturation=0.85,' +
    'colorbalance=rs=-0.08:bs=0.12:gs=-0.02:rm=0.03:gm=0.02:bm=-0.05:rh=0.18:gh=0.08:bh=-0.12',
  // v2 grades (STYLE.md v2.0): neutral-clean base, cast-corrected.
  clean: 'eq=contrast=1.07:saturation=1.06:brightness=0.015,' +
    'colorbalance=rs=-0.03:bs=0.05,colortemperature=temperature=6900:mix=0.4',
  warmfood: 'eq=contrast=1.06:saturation=1.10:brightness=0.01,' +
    'colorbalance=bs=0.04:rh=0.04:bh=-0.01,colortemperature=temperature=6650:mix=0.25',
  heritage: 'eq=brightness=0.03:contrast=1.10:saturation=0.92,' +
    'colorbalance=rs=-0.05:bs=0.08:rh=0.07:gh=0.03:bh=-0.04',
};
const grade = GRADES[args.style || 'clean'];
if (!grade) fail(`Unknown --style "${args.style}". Supported: ${Object.keys(GRADES).join(', ')}`);
const filters = [grade];
// CJK title font preference: calligraphy (Ma Shan Zheng) -> 文楷 (LXGW WenKai)
// -> Noto CJK. The cycle downloads the first two into custom-cjk/ (OFL-licensed).
const CJK_FONTS = [
  'automation/youtube/assets/fonts/MaShanZheng-Regular.ttf', // committed in-repo (OFL)
  '/usr/share/fonts/truetype/custom-cjk/MaShanZheng-Regular.ttf',
  '/usr/share/fonts/truetype/custom-cjk/LXGWWenKai-Regular.ttf',
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
];
const LATIN_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const font = /[^\x00-\x7F]/.test(args.title || '')
  ? CJK_FONTS.find((f) => existsSync(f)) || LATIN_FONT
  : LATIN_FONT;
if (args.title && existsSync(font)) {
  const titleFile = join(tmp, 'title.txt');
  await writeFile(titleFile, wrap(args.title, 24));
  filters.push(
    `drawtext=fontfile=${font}:textfile=${titleFile}:fontsize=${vertical ? 64 : 72}:fontcolor=white:` +
    `borderw=4:bordercolor=black@0.85:x=(w-text_w)/2:y=${vertical ? 'h*0.22' : '(h-text_h)/2'}:` +
    `line_spacing=14:enable='between(t,0.4,3.9)'`,
  );
} else if (args.title) {
  process.stderr.write('DejaVuSans-Bold not found; skipping title overlay.\n');
}
if (args.badge && existsSync(LATIN_FONT)) {
  // Persistent brand badge (persona 2026-08-10): small, whole video, top strip —
  // brands every frame so TikTok/IG algorithms and viewers tie the clip to the IP
  // without touching the 0-second hook.
  filters.push(
    `drawtext=fontfile=${LATIN_FONT}:text='${args.badge.replace(/'/g, '')}':fontsize=${vertical ? 34 : 30}:` +
    `fontcolor=white@0.82:borderw=2:bordercolor=black@0.35:x=(w-text_w)/2:y=${vertical ? 118 : 40}`,
  );
}
const cjkFont = existsSync('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');
// --clips place labels: a small chip top-left for each labelled shot (own ASS so
// it never mixes with the cue styling). Times follow the segment plan.
const labelEvents = plan.map((p, i) => p.label && {
  text: p.label, start: segStarts[i], end: Math.min(audioDur, segStarts[i] + p.segLen - (i < plan.length - 1 ? XFADE : 0)),
}).filter((e) => e && e.end > e.start);
if (labelEvents.length) {
  const labelsPath = join(tmp, 'labels.ass');
  await writeFile(labelsPath, buildLabelsAss(labelEvents, { W, H, vertical, cjk: cjkFont }));
  filters.push(`subtitles=${labelsPath.replace(/([:,\\'\[\]])/g, '\\$1')}`);
}
let cueStarts = []; // seconds, for cue-synced SFX
if (args.srt) {
  if (!existsSync(args.srt)) fail(`--srt file not found: ${args.srt}`);
  // Noto Sans CJK covers zh/yue/ja; falls back to default font if not installed.
  const cjk = cjkFont;
  if (!cjk) process.stderr.write('WARN: fonts-noto-cjk not installed — CJK subtitles may render as boxes (apt-get install -y fonts-noto-cjk).\n');
  const cues = parseSrt(await readFile(args.srt, 'utf8'));
  cueStarts = cues.map((c) => c.start);
  if (SUB_STYLE === 'dynamic') {
    // Colored + animated burned subtitles (owner 2026-08-24). One styled ASS,
    // rendered by libass exactly like the plain path but with per-line colour and
    // a scale-bounce entrance per cue.
    const assPath = join(tmp, 'subs.ass');
    await writeFile(assPath, buildAss(cues, { W, H, vertical, voiced: !!audioFile, cjk }));
    // ASS carries its own PlayRes/styles; escape the path for the filter.
    filters.push(`subtitles=${assPath.replace(/([:,\\'\[\]])/g, '\\$1')}`);
  } else {
    // Legacy flat-white burned SRT.
    const subSize = audioFile ? (vertical ? 13 : 17) : (vertical ? 17 : 21);
    filters.push(`subtitles=${args.srt}:force_style='FontName=${cjk ? 'Noto Sans CJK SC' : 'DejaVu Sans'},FontSize=${subSize},Bold=1,Outline=2,Shadow=1,MarginV=${vertical ? 110 : 40}'`);
  }
}

// Fast mode: NO fade-in — frame one is the hook; only a short tail fade.
filters.push(FAST
  ? `fade=t=out:st=${(audioDur - 0.3).toFixed(2)}:d=0.3`
  : `fade=t=in:st=0:d=0.5,fade=t=out:st=${(audioDur - 0.4).toFixed(2)}:d=0.4`);
await mkdir(dirname(outFile), { recursive: true });
if (args.music && !existsSync(args.music)) fail(`--music file not found: ${args.music}`);

// Cue-synced SFX bed: one soft plucked pop per subtitle entry (skip cue 1 = the
// 0-second brand line, so the hook is never stepped on), pre-rendered to a WAV the
// length of the video so the final mux just amixes it under the music.
let sfxBed = null;
if (SFX === 'pop' && cueStarts.length > 1) {
  sfxBed = join(tmp, 'sfxbed.wav');
  const pluck = join(tmp, 'pluck.wav');
  // Exponentially-decayed dual sine = a clean, royalty-free "tick/pop" (no assets).
  run('ffmpeg', ['-y', '-f', 'lavfi', '-i',
    "aevalsrc='(0.6*sin(2*PI*760*t)+0.4*sin(2*PI*1240*t))*exp(-26*t):s=44100:d=0.14'",
    '-ac', '2', pluck]);
  const hits = cueStarts.slice(1).filter((t) => t < audioDur - 0.05);
  const parts = hits.map((t, i) => `[0:a]adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[p${i}]`);
  const mixIns = hits.map((_, i) => `[p${i}]`).join('');
  run('ffmpeg', ['-y', '-i', pluck, '-filter_complex',
    `${parts.join(';')};${mixIns}amix=inputs=${hits.length}:normalize=0[m];[m]apad[o]`,
    '-map', '[o]', '-t', audioDur.toFixed(2), sfxBed]);
}

if (audioFile) {
  // Voiceover mode: VO is the main track; optional music bed mixed in quiet.
  const voiced = args.music || sfxBed || ambient ? join(tmp, 'voiced.mp4') : outFile;
  run('ffmpeg', ['-y', '-i', silent, '-i', audioFile, '-vf', filters.join(','),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', voiced]);
  if (args.music || sfxBed || ambient) {
    const ins = ['-i', voiced];
    const parts = [];
    let n = 1;
    const mix = ['[0:a]'];
    if (args.music) { ins.push('-stream_loop', '-1', '-i', args.music); parts.push(`[${n}:a]volume=${args['music-volume'] != null ? MUSIC_VOL : 0.13},afade=t=in:d=1[m]`); mix.push('[m]'); n++; }
    if (sfxBed) { ins.push('-i', sfxBed); parts.push(`[${n}:a]volume=0.5[s]`); mix.push('[s]'); n++; }
    if (ambient) { ins.push('-i', ambient); parts.push(`[${n}:a]volume=${KEEP_AUDIO}[amb]`); mix.push('[amb]'); n++; }
    run('ffmpeg', ['-y', ...ins, '-filter_complex',
      `${parts.join(';')};${mix.join('')}amix=inputs=${mix.length}:duration=first:dropout_transition=2:normalize=0[aout]`,
      '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
      '-movflags', '+faststart', outFile]);
  }
} else if (args.music && !ambient) {
  // Subtitle-driven mode (owner directive 2026-07-10): no narration — the music
  // IS the audio, at full presence, looped/trimmed to the target duration; the
  // SFX pops sit lightly on top, synced to each cue's entry.
  const ins = ['-i', silent, '-stream_loop', '-1', '-i', args.music];
  let sfxChain = '';
  let aout = '[mus]';
  if (sfxBed) { ins.push('-i', sfxBed); sfxChain = `[2:a]volume=0.5[sfx];[mus][sfx]amix=inputs=2:duration=first:normalize=0[aout];`; aout = '[aout]'; }
  else { sfxChain = ''; aout = '[aout]'; }  // no SFX: the music chain itself emits [aout] (bug fixed 2026-09-09)
  run('ffmpeg', ['-y', ...ins,
    '-filter_complex',
    `[0:v]${filters.join(',')}[vout];` +
    `[1:a]volume=${musicGain},afade=t=in:d=1,afade=t=out:st=${Math.max(0, audioDur - 1.6).toFixed(2)}:d=1.5${sfxBed ? '[mus]' : '[aout]'};` +
    sfxChain,
    '-map', '[vout]', '-map', aout, '-t', audioDur.toFixed(2),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outFile]);
} else {
  // Subtitle-driven mode with the clips' own ambient sound (--keep-audio): music
  // (optional) + ambient bed + SFX pops, one mix, same tail fade as the music.
  const ins = ['-i', silent];
  const parts = [];
  const mix = [];
  let n = 1;
  const tail = `afade=t=out:st=${Math.max(0, audioDur - 1.6).toFixed(2)}:d=1.5`;
  if (args.music) { ins.push('-stream_loop', '-1', '-i', args.music); parts.push(`[${n}:a]volume=${musicGain},afade=t=in:d=1,${tail}[mus]`); mix.push('[mus]'); n++; }
  ins.push('-i', ambient); parts.push(`[${n}:a]volume=${KEEP_AUDIO},afade=t=in:d=0.05,${tail}[amb]`); mix.push('[amb]'); n++;
  if (sfxBed) { ins.push('-i', sfxBed); parts.push(`[${n}:a]volume=0.5[sfx]`); mix.push('[sfx]'); n++; }
  const mixed = mix.length > 1 ? `${mix.join('')}amix=inputs=${mix.length}:duration=first:normalize=0[aout]` : `${mix[0]}anull[aout]`;
  run('ffmpeg', ['-y', ...ins,
    '-filter_complex', `[0:v]${filters.join(',')}[vout];${parts.join(';')};${mixed}`,
    '-map', '[vout]', '-map', '[aout]', '-t', audioDur.toFixed(2),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outFile]);
}

let credits;
if (!CLIPS_FILE) {
  credits = clips.map(({ query, sourceUrl, photographer, source, kind }) => ({ query, sourceUrl, photographer, source, ...(kind ? { kind } : {}) }));
} else {
  // Only sources that are actually on screen, with where they appear — the slug
  // gate checks spoken/labelled place names against exactly these URLs.
  const r2 = (x) => Math.round(x * 100) / 100;
  credits = clips.map((c) => {
    const at = [];
    const labels = new Set();
    plan.forEach((p, i) => {
      if (p.clip !== c || segStarts[i] >= audioDur) return;
      at.push([r2(segStarts[i]), r2(Math.min(audioDur, segStarts[i] + p.segLen))]);
      if (p.label) labels.add(p.label);
    });
    return at.length && {
      id: c.id, sourceUrl: c.sourceUrl, photographer: c.photographer, source: c.source,
      ...(c.kind === 'photo' ? { kind: 'photo' } : {}), license: c.license,
      ...(c.attribution ? { attribution: c.attribution } : {}),
      ...(labels.size ? { label: [...labels].join(' / ') } : {}), at,
    };
  }).filter(Boolean);
}
await writeFile(`${outFile}.credits.json`, JSON.stringify(credits, null, 2));
const outDur = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', outFile]));
console.log(`Wrote ${outFile} (${outDur.toFixed(1)}s, ${W}x${H}) + ${outFile}.credits.json (${credits.length} clip credits)`);
if (ambientNote) {
  // The routine cannot hear the result: report the ambient outcome and the
  // integrated loudness (music-only Shorts at 0.85 measure about -19 to -21 LUFS).
  const lufs = loudnessLufs(outFile);
  console.log(`${ambientNote}; output loudness ${lufs == null ? 'unknown' : `${lufs.toFixed(1)} LUFS`}`);
  if (lufs != null && lufs < QUIET_LUFS) {
    process.stderr.write(`WARN: output is quiet (${lufs.toFixed(1)} LUFS < ${QUIET_LUFS}; music-only Shorts measure about -19 to -21) — raise --music-volume or --keep-audio\n`);
  }
}
// Work files (4K renditions with --clips) are removed after a successful run; KEEP_TMP=1 keeps them.
if (process.env.KEEP_TMP === '1') process.stderr.write(`KEEP_TMP=1: work files kept in ${tmp}\n`);
else await rm(tmp, { recursive: true, force: true });

function pickFile(files = []) {
  // Prefer the smallest file that still covers the target resolution.
  const target = Math.max(W, H);
  const usable = files
    .filter((f) => f.file_type === 'video/mp4' && Math.max(f.width || 0, f.height || 0) >= target * 0.9)
    .sort((a, b) => Math.max(a.width, a.height) - Math.max(b.width, b.height));
  return usable[0] || files.sort((a, b) => Math.max(b.width || 0, b.height || 0) - Math.max(a.width || 0, a.height || 0))[0];
}

// --- --clips helpers ----------------------------------------------------------
// Smallest rendition that needs no upscaling for this fit (crop must cover both
// axes, frame only one), capped at 4K; else the largest available.
function pickRendition(list, mode) {
  const sorted = list.filter((r) => r.url && r.w && r.h).sort((a, b) => a.w * a.h - b.w * b.h);
  const capped = sorted.filter((r) => Math.max(r.w, r.h) <= 3840);
  const ok = (r) => (mode === 'frame' ? (r.w >= W * 0.9 || r.h >= H * 0.9) : (r.w >= W * 0.9 && r.h >= H * 0.9));
  return capped.find(ok) || capped[capped.length - 1] || sorted[sorted.length - 1];
}

function resolveFit(clip) {
  const mode = clip.fit || FIT;
  if (mode !== 'auto') return mode;
  if (!clip.w || !clip.h || W === H) return 'crop'; // 1x1 keeps the historical centre-crop
  if (Math.abs((clip.w / clip.h) / (W / H) - 1) < 0.05) return 'crop';
  if (clip.cx != null) return 'crop';
  return (clip.h > clip.w) === vertical ? 'crop' : 'frame';
}

// Video fill to TW x TH. crop without cx is the exact historical chain.
function fitChain(clip, TW, TH) {
  const mode = clip.fitMode || 'crop';
  if (mode === 'frame') {
    const bw = Math.ceil(TW / 8) * 2, bh = Math.ceil(TH / 8) * 2; // blur at quarter size: cheap and smooth
    return `split[fa][fb];[fa]scale=${bw}:${bh}:force_original_aspect_ratio=increase,crop=${bw}:${bh},` +
      `gblur=sigma=9,eq=brightness=-0.12:saturation=0.85,scale=${TW}:${TH},setsar=1[fbg];` +
      `[fb]scale=${TW}:${TH}:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1[ffg];` +
      `[fbg][ffg]overlay=(W-w)/2:(H-h)/2`;
  }
  const at = clip.cx != null ? `:x='(iw-ow)*${clip.cx}':y='(ih-oh)/2'` : '';
  return `scale=${TW}:${TH}:force_original_aspect_ratio=increase,crop=${TW}:${TH}${at}`;
}

// POV walk-in for a still (see POV_PRESETS). 1.5x working canvas so the 1.5x
// near-ground zoom never upscales; vanishing point clamped to x 0.3-0.7 / y
// 0.35-0.7 (measured to stay >= 1.4 px inside the photo); per-segment step phase
// so back-to-back cuts do not repeat the same footfall. Needs -r 30 on output.
function povFilter(segLen, i, o, vp, cropAt = '', fps = 30) {
  const SW = Math.ceil((W * 1.5) / 2) * 2, SH = Math.ceil((H * 1.5) / 2) * 2;
  const vx = Math.min(0.7, Math.max(0.3, Number(vp[0]))) * SW, vy = Math.min(0.7, Math.max(0.35, Number(vp[1]))) * SH;
  const t = `(in/${fps}+${((i * 0.37) % 1).toFixed(2)})`;
  const inv = (s1) => `((1-${((1 - o.s0 / s1) / segLen).toFixed(6)}*in/${fps})/${o.s0})`;
  const th = `(${(o.rollDeg * Math.PI / 180).toFixed(6)}*sin(PI*${o.step}*${t}))`;
  const bx = `(${(o.sway * SW).toFixed(2)}*sin(PI*${o.step}*${t}+0.6)+${(o.jitter * SW).toFixed(2)}*(sin(2*PI*3.7*${t}+1.3)+0.6*sin(2*PI*5.9*${t}+0.4)))`;
  const by = `(${(o.bob * SH).toFixed(2)}*(1-2*abs(sin(PI*${o.step}*${t})))+${(o.jitter * SH).toFixed(2)}*(sin(2*PI*4.3*${t}+2.1)+0.6*sin(2*PI*6.7*${t}+0.9)))`;
  const corner = (u, v) => {
    const k = v ? inv(o.sBot) : inv(o.sTop);
    const dx = (u * SW - vx).toFixed(1), dy = (v * SH - vy).toFixed(1);
    return [`${vx.toFixed(1)}+${k}*(${dx}*cos(${th})-(${dy})*sin(${th})+${bx})`,
      `${vy.toFixed(1)}+${k}*(${dx}*sin(${th})+(${dy})*cos(${th})+${by})`];
  };
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = [corner(0, 0), corner(1, 0), corner(0, 1), corner(1, 1)];
  return `scale=${SW}:${SH}:force_original_aspect_ratio=increase:flags=lanczos,crop=${SW}:${SH}${cropAt},setsar=1,` +
    `loop=loop=${Math.round(segLen * fps) - 1}:size=1,setpts=N/(${fps}*TB),` +
    `perspective=x0='${x0}':y0='${y0}':x1='${x1}':y1='${y1}':x2='${x2}':y2='${y2}':x3='${x3}':y3='${y3}':interpolation=linear:eval=frame,` +
    `scale=${W}:${H}:flags=bicubic,format=yuv420p`;
}

// Mean level of an audio file in dBFS (-Infinity when unreadable or digital silence).
function meanVolumeDb(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const m = /mean_volume:\s*(-?[\d.]+) dB/.exec(r.stderr || '');
  return m ? Number(m[1]) : -Infinity;
}

// Integrated loudness (EBU R128) of a file's first audio stream, or null.
function loudnessLufs(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-map', '0:a:0', '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const m = /Integrated loudness:\s*I:\s*(-?[\d.]+)\s*LUFS/.exec(r.stderr || '');
  return m ? Number(m[1]) : null;
}

function probe(file) {
  let j = {};
  try {
    j = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries',
      'format=duration:stream=codec_type,width,height:stream_tags=rotate:stream_side_data=rotation', '-of', 'json', file]));
  } catch { /* run() already exits on failure */ }
  const streams = j.streams || [];
  const v = streams.find((s) => s.codec_type === 'video') || {};
  const rot = Number(v.tags?.rotate || (v.side_data_list || []).find((d) => d.rotation != null)?.rotation || 0);
  const swap = Math.abs(rot) % 180 === 90;
  return { w: swap ? v.height : v.width, h: swap ? v.width : v.height, duration: Number(j.format?.duration) || 0,
    hasAudio: streams.some((s) => s.codec_type === 'audio') };
}

async function pexelsGet(url, id) {
  if (!API_KEY) fail(`Missing PEXELS_API_KEY (environment secret) — needed to resolve ${id}`);
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) fail(`Pexels API error ${res.status} resolving ${id}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function resolveClipId(id, k) {
  let m;
  if ((m = id.match(/^px-(\d+)$/))) {
    const v = await pexelsGet(`https://api.pexels.com/videos/videos/${m[1]}`, id);
    const renditions = (v.video_files || []).filter((f) => f.file_type === 'video/mp4')
      .map((f) => ({ url: f.link, w: f.width, h: f.height }));
    if (!renditions.length) fail(`Pexels ${id} has no mp4 renditions`);
    return { id, kind: 'video', w: v.width, h: v.height, duration: v.duration, renditions, sourceUrl: v.url,
      photographer: v.user?.name || '', source: 'Pexels', license: 'Pexels License' };
  }
  if ((m = id.match(/^pxp-(\d+)$/))) {
    const p = await pexelsGet(`https://api.pexels.com/v1/photos/${m[1]}`, id);
    return { id, kind: 'photo', url: photoLink(p), w: p.width, h: p.height, sourceUrl: p.url,
      photographer: p.photographer || '', source: 'Pexels', license: 'Pexels License' };
  }
  if (id.startsWith('wm:')) return resolveCommons(id, id.slice(3).trim());
  if (id.startsWith('file:')) {
    const path = id.slice(5);
    if (!existsSync(path)) fail(`--clips entry ${k}: local file not found: ${path}`);
    return { id, kind: /\.(jpe?g|png|webp)$/i.test(path) ? 'photo' : 'video', localPath: path,
      sourceUrl: `owner:${path}`, photographer: 'owner', source: 'Owner', license: 'owner footage' };
  }
  fail(`--clips entry ${k}: unknown id "${id}" (use px-<n>, pxp-<n>, wm:File:<name>, file:/abs/path)`);
}

// Commons: file URL + licence via the MediaWiki API (User-Agent required; the API
// answers rate-limited requests with a non-JSON page, so retry with backoff).
// Fail closed on anything but CC0 / public domain / CC BY, and on YouTube mirrors.
async function resolveCommons(id, name) {
  const title = name.startsWith('File:') ? name : `File:${name}`;
  const params = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', titles: title, prop: 'videoinfo',
    viprop: 'url|size|mime|extmetadata|derivatives', viextmetadatafilter: 'LicenseShortName|Artist|Credit|AttributionRequired',
    [vertical ? 'viurlheight' : 'viurlwidth']: '3200' });
  const res = await fetchCommons(`https://commons.wikimedia.org/w/api.php?${params}`, `${id} (API)`);
  const txt = await res.text();
  let j;
  try { j = JSON.parse(txt); } catch { fail(`Commons API unavailable for ${id} (HTTP ${res.status}): ${txt.slice(0, 120)}`); }
  const page = j.query?.pages?.[0];
  const vi = page?.videoinfo?.[0];
  if (!page || page.missing || !vi) fail(`Commons file not found: ${title}`);
  const em = vi.extmetadata || {};
  const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const license = strip(em.LicenseShortName?.value);
  const artist = strip(em.Artist?.value) || 'unknown';
  const credit = strip(em.Credit?.value);
  const okLicense = /^(cc0|public domain|pd\b|pd-|cc[ -]by \d)/i.test(license) && !/\b(sa|nc|nd)\b/i.test(license);
  if (!okLicense) fail(`Commons ${title}: licence "${license || 'unknown'}" not allowed (CC0 / public domain / CC BY only)`);
  if (/youtube\.com|youtu\.be|\byoutube\b/i.test(credit)) fail(`Commons ${title}: YouTube-origin mirror (Credit: ${credit.slice(0, 80)}) — channel rule forbids re-editing other people's YouTube videos`);
  const isPhoto = /^image\//.test(vi.mime || '');
  const ccBy = /^cc[ -]by/i.test(license);
  const base = { id, sourceUrl: vi.descriptionurl, photographer: artist, source: 'Wikimedia Commons', license,
    ...(ccBy ? { attribution: `"${title.replace(/^File:/, '')}" by ${artist}, ${license}, via Wikimedia Commons (${vi.descriptionurl})` } : {}) };
  if (isPhoto) return { ...base, kind: 'photo', url: vi.thumburl || vi.url, w: vi.width, h: vi.height };
  const renditions = [{ url: vi.url, w: vi.width, h: vi.height },
    ...(vi.derivatives || []).map((d) => ({ url: d.src, w: Number(d.width), h: Number(d.height) }))];
  return { ...base, kind: 'video', w: vi.width, h: vi.height, duration: Number(vi.duration) || 0, renditions };
}

// Wikimedia (API and upload.wikimedia.org) answers bursts with 429: send the
// User-Agent it requires and back off (Retry-After when given), 5 retries max.
async function fetchCommons(url, what) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': COMMONS_UA } });
    if ((res.status !== 429 && res.status < 500) || attempt === 6) return res;
    const wait = Math.min(60, Number(res.headers.get('retry-after')) || 10 * attempt);
    process.stderr.write(`Commons busy (HTTP ${res.status}) for ${what} — retry ${attempt}/5 in ${wait}s\n`);
    await res.arrayBuffer().catch(() => {});
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
}

// One --clips entry -> one segment slot (validated; lengths frame-exact).
function normalizeEntry({ clip, raw: e, k }) {
  const num = (v, name) => {
    const x = Number(v);
    if (!Number.isFinite(x)) fail(`--clips entry ${k} (${clip.id}): "${name}" must be a number`);
    return x;
  };
  const inS = e.in != null ? num(e.in, 'in') : 0;
  let outS = e.out != null ? num(e.out, 'out') : inS + SEG;
  if (clip.kind !== 'photo' && clip.duration) {
    const maxOut = Math.floor(clip.duration * 30 - 1) / 30;
    if (inS >= maxOut) fail(`--clips entry ${k} (${clip.id}): in=${inS}s is past the clip's end (${clip.duration.toFixed(2)}s)`);
    if (outS > maxOut) {
      if (e.out != null) process.stderr.write(`WARN: --clips entry ${k} (${clip.id}): out=${outS}s > clip length ${clip.duration.toFixed(2)}s — clamped\n`);
      outS = maxOut;
    }
  }
  const segLen = Math.round((outS - inS) * 30) / 30;
  if (!(segLen >= 0.5) || segLen <= XFADE + 0.2) fail(`--clips entry ${k} (${clip.id}): in/out gives ${segLen.toFixed(2)}s (too short)`);
  if (e.mute != null && !(Array.isArray(e.mute) && e.mute.every((r) => Array.isArray(r) && r.length === 2 && r.every(Number.isFinite) && r[1] > r[0]))) {
    fail(`--clips entry ${k} (${clip.id}): mute must be [[from, to], ...] in source seconds`);
  }
  if (e.vp != null && !(Array.isArray(e.vp) && e.vp.length === 2 && e.vp.every(Number.isFinite))) fail(`--clips entry ${k} (${clip.id}): vp must be [x, y]`);
  const label = typeof e.label === 'string' && e.label.trim() ? e.label.trim() : null;
  if (label && clip.source !== 'Owner') {
    const missing = labelMissingWords(label, clip.sourceUrl);
    if (missing) {
      process.stderr.write(`WARN: label "${label}" is not named in ${clip.id}'s source (${clip.sourceUrl}; ${missing}) — slug gate: do not name a place the source does not name\n`);
    }
  }
  return { clip, start: clip.kind === 'photo' ? 0 : inS, segLen, mute: e.mute || null, label, vp: e.vp || null,
    cx: e.cx != null ? Number(e.cx) : clip.cx, fit: e.fit || clip.fit };
}

// One --clips segment's view of its (shared) source: that entry's cx / fit.
function entryView(p) {
  const v = { ...p.clip, cx: p.cx ?? null, fit: p.fit ?? null };
  v.fitMode = resolveFit(v);
  return v;
}

// Slug gate for on-screen labels. Returns null when the source URL / Commons title
// names the label, else a short reason. Matching is on whole slug tokens (or runs
// of them: "zhangjiajie" = "zhang-jia-jie"), so "Dali" does not match "dalian";
// a trailing plural "s" is ignored on both sides.
function labelMissingWords(label, source) {
  let hay = String(source || '');
  try { hay = decodeURIComponent(hay); } catch { /* malformed % escape: match the raw URL */ }
  const tokens = (s) => s.toLowerCase().split(/[^a-z0-9㐀-鿿]+/).filter(Boolean);
  const norm = (w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);
  const hayT = tokens(hay).map(norm);
  const runs = new Set();
  for (let i = 0; i < hayT.length; i++) {
    for (let j = i + 1; j <= Math.min(hayT.length, i + 6); j++) runs.add(hayT.slice(i, j).join(''));
  }
  const lab = tokens(label).map(norm);
  if (!lab.length) return 'label has no words';
  if (runs.has(lab.join(''))) return null; // the whole phrase ("West Lake", "Great Wall") is in the source
  const key = lab.filter((w) => w.length >= 3 && !GENERIC_PLACE_WORDS.has(w) && !GENERIC_PLACE_WORDS.has(`${w}s`));
  if (!key.length) return 'only generic words, and the phrase itself is not in the source';
  const hayLow = hay.toLowerCase();
  const SPELLING = { macau: 'macao', macao: 'macau' }; // romanisation variants used in slugs/titles
  const miss = key.filter((w) => !(CJK_RE.test(w) ? hayLow.includes(w) : runs.has(w) || runs.has(SPELLING[w])));
  return miss.length ? `missing: ${miss.join(', ')}` : null;
}

function buildLabelsAss(events, { W, H, vertical, cjk }) {
  const hasCjk = events.some((e) => CJK_RE.test(e.text));
  const fontName = hasCjk && cjk ? 'Noto Sans CJK SC' : 'DejaVu Sans';
  const [x, y, fs] = vertical ? [58, 196, 42] : [56, 92, 36];
  return [
    '[Script Info]', 'ScriptType: v4.00+', `PlayResX: ${W}`, `PlayResY: ${H}`, 'WrapStyle: 2', 'ScaledBorderAndShadow: yes', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Chip,${fontName},${fs},&H00FFFFFF,&H00FFFFFF,&H99000000,&H99000000,1,0,0,0,100,100,0,0,3,10,0,7,0,0,0,1`,
    '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ...events.map((e) => `Dialogue: 1,${assTime(e.start)},${assTime(e.end)},Chip,,0,0,0,,{\\pos(${x},${y})\\fad(120,120)}${assEsc(e.text)}`),
  ].join('\n') + '\n';
}

function wrap(text, width) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width && line) { lines.push(line); line = w; }
    else line = (line ? line + ' ' : '') + w;
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

// --- Subtitle helpers (dynamic colored/animated ASS) -----------------------
function srtTime(s) {
  const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) return 0;
  return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
}
function parseSrt(text) {
  const blocks = text.replace(/\r/g, '').trim().split(/\n\n+/);
  const cues = [];
  for (const b of blocks) {
    const lines = b.split('\n');
    const ti = lines.findIndex((l) => l.includes('-->'));
    if (ti < 0) continue;
    const [a, z] = lines[ti].split('-->');
    const body = lines.slice(ti + 1).filter((l) => l.trim() !== '');
    cues.push({ start: srtTime(a), end: srtTime(z), en: (body[0] || '').trim(), zh: (body.slice(1).join(' ') || '').trim() });
  }
  return cues;
}
function assTime(t) {
  const cs = Math.round(t * 100);
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}
// Strip whole ASS override blocks first ({\fs13} etc. that leak into the ZH
// accent line via the SRT line-2 convention), THEN clean any stray braces/
// backslashes. Without the first pass, "{\fs13}brand" rendered as "⧵fs13brand".
function assEsc(s) { return s.replace(/\{[^}]*\}/g, '').replace(/[{}]/g, '').replace(/\\/g, '⧵'); }
function highlightNums(s, base) {
  // Coral pop on numbers/quantities — the 小红书 "数字弹出条" feel. A unit only
  // joins the number when it is a standalone token (so "900 meters" colours "900",
  // not "900 m|eters").
  return assEsc(s).replace(
    /(\$?\d[\d,.]*(?:\s?(?:m|km|km²|%|°C|°|AD|BC|BCE|CE|am|pm|kg|min|hrs?|hours?|years?)(?![A-Za-z]))?)/gi,
    // v3.1: numbers also scale up 15% — the price/number IS the hook (owner 2026-09-09)
    (mtch) => `{\\c${C_CORAL}\\fscx115\\fscy115}${mtch}{\\c${base}\\fscx100\\fscy100}`,
  );
}
// Wrap a long CJK line (no spaces to break on) onto two lines at a punctuation
// mark near the middle, so burned Chinese never overflows the frame width.
function wrapZh(zh, maxChars) {
  if ([...zh].length <= maxChars) return zh;
  const chars = [...zh];
  const mid = Math.floor(chars.length / 2);
  let best = -1;
  for (let i = 0; i < chars.length; i++) {
    if ('，、；：。！？'.includes(chars[i]) && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  const cut = best >= 0 ? best + 1 : mid;
  return chars.slice(0, cut).join('') + '\\N' + chars.slice(cut).join('');
}
function buildAss(cues, { W, H, vertical, voiced, cjk }) {
  const fontName = cjk ? 'Noto Sans CJK SC' : 'DejaVu Sans';
  // Shorts v3.1 (owner 2026-09-09 「不够劲爆」): hook text must read like the
  // competitors' — big, lower-third, numbers oversized. Was 72/130.
  const enFs = vertical ? (voiced ? 54 : 96) : (voiced ? 44 : 62);
  const zhFs = vertical ? (voiced ? 60 : 80) : (voiced ? 48 : 60);
  const marginV = vertical ? 300 : 70;
  const marginLR = vertical ? 70 : 90;
  const header = [
    '[Script Info]', 'ScriptType: v4.00+', `PlayResX: ${W}`, `PlayResY: ${H}`,
    'WrapStyle: 0', 'ScaledBorderAndShadow: yes', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    // PrimaryColour 8-digit &HAABBGGRR (opaque white), semi-opaque dark box off, strong outline.
    `Style: Sub,${fontName},${enFs},&H00FFFFFF,&H000000FF,&H00101010,&H90000000,1,0,0,0,100,100,0,0,1,4.5,1.6,2,${marginLR},${marginLR},${marginV},1`,
    '', '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];
  const anim = '{\\fad(70,40)\\fscx60\\fscy60\\t(0,120,\\fscx110\\fscy110)\\t(120,220,\\fscx100\\fscy100)}';
  const zhMax = vertical ? 12 : 20;
  const dialog = cues.map((c, i) => {
    const enBase = c.en.trimStart().startsWith('★') ? C_AMBER : C_WHITE;
    // cue 1 IS the hook: 1.2x so the claim lands before anyone reads anything else
    const hookFs = i === 0 && !voiced ? `{\\fs${Math.round(enFs * 1.2)}}` : '';
    const en = `${hookFs}{\\c${enBase}}${highlightNums(c.en, enBase)}`;
    // Line 2 is the gold ZH accent only when it really is CJK; an English
    // second line keeps the lead line's colour (bug fixed 2026-10-17) at the
    // historical line-2 size, so the hook cue's 1.2x does not carry over.
    const zh = !c.zh ? ''
      : CJK_RE.test(c.zh) ? `\\N{\\fs${zhFs}\\c${C_GOLD}}${wrapZh(assEsc(c.zh), zhMax)}`
        : `\\N{\\fs${zhFs}\\c${enBase}}${highlightNums(c.zh, enBase)}`;
    return `Dialogue: 0,${assTime(c.start)},${assTime(c.end)},Sub,,0,0,0,,${anim}${en}${zh}`;
  });
  return header.concat(dialog).join('\n') + '\n';
}

function run(bin, argv) {
  try {
    return execFileSync(bin, argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim();
  } catch (e) {
    fail(`${bin} ${argv.slice(0, 4).join(' ')}... failed:\n${e.stderr || e.message}`);
  }
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  }
  return o;
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
