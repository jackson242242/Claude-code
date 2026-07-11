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
 *     [--style default|riben] [--music bgm.mp3]
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
 * Also writes <out>.credits.json (Pexels source URLs per clip) so the uploader can
 * append attribution to the video description.
 */
import { execFileSync } from 'node:child_process';
import { writeFile, mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) fail('Missing PEXELS_API_KEY (environment secret). Free key: https://www.pexels.com/api/');

const args = parseArgs(process.argv.slice(2));
const audioFile = args.audio; // optional since 2026-07-10: subtitle-driven mode
const outFile = args.out;
const queries = (args.queries || '').split(',').map((q) => q.trim()).filter(Boolean);
if (!outFile || queries.length === 0 || (!audioFile && !(args.duration && args.music))) {
  fail('Usage: node scripts/assemble-video.mjs --out <mp4> --queries "a,b,c" ' +
    '(--audio <vo.mp3> | --duration <sec> --music <bgm.mp3>) [--format 16x9|9x16|1x1] ' +
    '[--title "..."] [--srt subs.srt] [--style riben] [--music bgm.mp3]\n' +
    'No --audio = subtitle-driven mode: music becomes the main track at full presence.');
}
const FORMATS = { '16x9': [1920, 1080], '9x16': [1080, 1920], '1x1': [1080, 1080] };
const fmtName = args.format || '16x9';
if (!FORMATS[fmtName]) fail(`Unknown --format "${fmtName}". Supported: ${Object.keys(FORMATS).join(', ')}`);
const [W, H] = FORMATS[fmtName];
const vertical = H > W;
const SEG = Number(args['seg-seconds'] || 6);
const MAX_CLIPS = Number(args['max-clips'] || 10);

for (const bin of ['ffmpeg', 'ffprobe']) {
  try { execFileSync(bin, ['-version'], { stdio: 'ignore' }); }
  catch { fail(`${bin} not found. Install with: apt-get update && apt-get install -y ffmpeg`); }
}

const audioDur = audioFile
  ? Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioFile]))
  : Number(args.duration);
if (!audioDur || Number.isNaN(audioDur)) fail(audioFile ? `Could not read duration of ${audioFile}` : '--duration must be a number of seconds');
const XFADE = 0.45; // crossfade between shots; each join consumes this much footage
const nSegs = Math.max(1, Math.ceil((audioDur + 1) / (SEG - XFADE)));
process.stderr.write(`Voiceover ${audioDur.toFixed(1)}s -> ${nSegs} segment(s) of ~${SEG}s at ${W}x${H} (crossfaded)\n`);

// 1. Find candidate clips on Pexels. Square renders center-crop from landscape
// inventory (Pexels has few native square videos).
const orientation = vertical ? 'portrait' : 'landscape';
const clips = [];
const seen = new Set();
for (const q of queries) {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=${orientation}&size=medium&per_page=6`,
    { headers: { Authorization: API_KEY } },
  );
  if (!res.ok) fail(`Pexels API error ${res.status} for "${q}": ${await res.text()}`);
  const data = await res.json();
  for (const v of data.videos || []) {
    if (seen.has(v.id) || clips.length >= MAX_CLIPS) continue;
    const file = pickFile(v.video_files);
    if (!file) continue;
    seen.add(v.id);
    clips.push({ id: v.id, query: q, url: file.link, duration: v.duration, sourceUrl: v.url, photographer: v.user?.name || '' });
  }
}
if (clips.length === 0) fail('Pexels returned no usable clips for the given queries.');
process.stderr.write(`Using ${clips.length} unique clip(s) from Pexels\n`);

// 2. Download and normalize each needed segment (cycle clips if fewer than segments).
const tmp = await mkdtemp(join(tmpdir(), 'assemble-'));
const downloaded = new Map();
const segFiles = [];
for (let i = 0; i < nSegs; i++) {
  const clip = clips[i % clips.length];
  if (!downloaded.has(clip.id)) {
    const raw = join(tmp, `clip-${clip.id}.mp4`);
    const res = await fetch(clip.url);
    if (!res.ok) fail(`Failed to download clip ${clip.id}: HTTP ${res.status}`);
    await writeFile(raw, Buffer.from(await res.arrayBuffer()));
    downloaded.set(clip.id, raw);
  }
  const segLen = SEG; // -shortest trims trailing excess against the voiceover
  // Reuse of the same clip in a later cycle starts deeper into the clip for variety.
  const start = Math.min(Math.floor(i / clips.length) * SEG, Math.max(0, (clip.duration || SEG) - segLen));
  const seg = join(tmp, `seg-${String(i).padStart(3, '0')}.mp4`);
  // Gentle Ken Burns drift: cover-scale 12% over target, then pan across it —
  // alternating direction per shot — so even static footage has camera motion.
  const W2 = Math.ceil((W * 1.12) / 2) * 2;
  const H2 = Math.ceil((H * 1.12) / 2) * 2;
  const drift = i % 2 === 0 ? `(in_w-out_w)*(t/${segLen})` : `(in_w-out_w)*(1-t/${segLen})`;
  run('ffmpeg', ['-y', '-ss', String(start), '-i', downloaded.get(clip.id), '-t', segLen.toFixed(2),
    '-vf', `scale=${W2}:${H2}:force_original_aspect_ratio=increase,crop=${W2}:${H2},fps=30,crop=${W}:${H}:x='${drift}':y='(in_h-out_h)/2',format=yuv420p`,
    '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', seg]);
  segFiles.push(seg);
}

// 3. Crossfade segments into one silent reel, then mux voiceover (+ overlays).
const silent = join(tmp, 'silent.mp4');
if (segFiles.length === 1) {
  run('ffmpeg', ['-y', '-i', segFiles[0], '-c', 'copy', silent]);
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

// Cinematic grade first, overlays next, fade appended last (after subtitles).
// 'riben' = Japanese-aesthetic split-tone: lifted blacks, muted sat, cool shadows,
// warm highlights. 'default' = the original punchy grade.
const GRADES = {
  default: 'eq=contrast=1.05:saturation=1.12:brightness=0.01',
  riben: 'eq=brightness=0.05:contrast=1.15:saturation=0.85,' +
    'colorbalance=rs=-0.08:bs=0.12:gs=-0.02:rm=0.03:gm=0.02:bm=-0.05:rh=0.18:gh=0.08:bh=-0.12',
};
const grade = GRADES[args.style || 'default'];
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
if (args.srt) {
  if (!existsSync(args.srt)) fail(`--srt file not found: ${args.srt}`);
  // Noto Sans CJK covers zh/yue/ja; falls back to default font if not installed.
  const cjk = existsSync('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');
  if (!cjk) process.stderr.write('WARN: fonts-noto-cjk not installed — CJK subtitles may render as boxes (apt-get install -y fonts-noto-cjk).\n');
  // Subtitles carry the narrative in no-VO mode — larger and bolder than typical CC.
  const subSize = audioFile ? (vertical ? 13 : 17) : (vertical ? 17 : 21);
  filters.push(`subtitles=${args.srt}:force_style='FontName=${cjk ? 'Noto Sans CJK SC' : 'DejaVu Sans'},FontSize=${subSize},Bold=1,Outline=2,Shadow=1,MarginV=${vertical ? 110 : 40}'`);
}

filters.push(`fade=t=in:st=0:d=0.5,fade=t=out:st=${(audioDur - 0.4).toFixed(2)}:d=0.4`);
await mkdir(dirname(outFile), { recursive: true });
if (args.music && !existsSync(args.music)) fail(`--music file not found: ${args.music}`);

if (audioFile) {
  // Voiceover mode: VO is the main track; optional music bed mixed in quiet.
  const voiced = args.music ? join(tmp, 'voiced.mp4') : outFile;
  run('ffmpeg', ['-y', '-i', silent, '-i', audioFile, '-vf', filters.join(','),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', voiced]);
  if (args.music) {
    run('ffmpeg', ['-y', '-i', voiced, '-stream_loop', '-1', '-i', args.music,
      '-filter_complex',
      `[1:a]volume=0.13,afade=t=in:d=1[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
      '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
      '-movflags', '+faststart', outFile]);
  }
} else {
  // Subtitle-driven mode (owner directive 2026-07-10): no narration — the music
  // IS the audio, at full presence, looped/trimmed to the target duration.
  run('ffmpeg', ['-y', '-i', silent, '-stream_loop', '-1', '-i', args.music,
    '-filter_complex',
    `[0:v]${filters.join(',')}[vout];` +
    `[1:a]volume=0.85,afade=t=in:d=1,afade=t=out:st=${Math.max(0, audioDur - 1.6).toFixed(2)}:d=1.5[aout]`,
    '-map', '[vout]', '-map', '[aout]', '-t', audioDur.toFixed(2),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outFile]);
}

const credits = clips.map(({ query, sourceUrl, photographer }) => ({ query, sourceUrl, photographer }));
await writeFile(`${outFile}.credits.json`, JSON.stringify(credits, null, 2));
const outDur = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', outFile]));
console.log(`Wrote ${outFile} (${outDur.toFixed(1)}s, ${W}x${H}) + ${outFile}.credits.json (${credits.length} clip credits)`);

function pickFile(files = []) {
  // Prefer the smallest file that still covers the target resolution.
  const target = Math.max(W, H);
  const usable = files
    .filter((f) => f.file_type === 'video/mp4' && Math.max(f.width || 0, f.height || 0) >= target * 0.9)
    .sort((a, b) => Math.max(a.width, a.height) - Math.max(b.width, b.height));
  return usable[0] || files.sort((a, b) => Math.max(b.width || 0, b.height || 0) - Math.max(a.width || 0, a.height || 0))[0];
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
