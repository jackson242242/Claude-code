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
 *     [--sub-style dynamic|plain] [--sfx pop|none]
 *
 * --sub-style dynamic (default when --srt is present): colored + animated burned
 * subtitles (STYLE.md v2.4) — white EN lead, gold ZH accent, coral number pops,
 * amber "★ Expert Tip" line, per-cue scale-bounce fade-in; long CJK lines auto-wrap.
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
// Subtitle palette. Inline \c colours are 6-digit &HBBGGRR& (no alpha).
const C_WHITE = '&HFFFFFF&';   // EN lead
const C_GOLD = '&H00D7FF&';    // ZH accent (RGB 255,215,0)
const C_AMBER = '&H00A5FF&';   // Expert-Tip EN line (RGB 255,165,0)
const C_CORAL = '&H3C5AFF&';   // number pop (RGB 255,90,60)

for (const bin of ['ffmpeg', 'ffprobe']) {
  try { execFileSync(bin, ['-version'], { stdio: 'ignore' }); }
  catch { fail(`${bin} not found. Install with: apt-get update && apt-get install -y ffmpeg`); }
}

const audioDur = audioFile
  ? Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioFile]))
  : Number(args.duration);
if (!audioDur || Number.isNaN(audioDur)) fail(audioFile ? `Could not read duration of ${audioFile}` : '--duration must be a number of seconds');
// Pace engine (owner 2026-07-17: "太慢，拖拉"): fast = hard cuts, no drift, no
// fade-in (the first frame IS the hook); slow = crossfades + Ken Burns (Sunday
// longform / heritage pieces only).
const FAST = (args.pace || 'fast') === 'fast';
const XFADE = FAST ? 0 : 0.45;
const nSegs = Math.max(1, Math.ceil((audioDur + 1) / (SEG - XFADE)));
process.stderr.write(`Audio ${audioDur.toFixed(1)}s -> ${nSegs} segment(s) of ~${SEG}s at ${W}x${H} (${FAST ? 'hard cuts' : 'crossfaded'})\n`);

// 1. Find candidate clips — Pexels always; Pixabay too when PIXABAY_API_KEY is
// set (both free-for-commercial-use, no attribution required; sources recorded
// in credits regardless). Square renders center-crop from landscape inventory.
const orientation = vertical ? 'portrait' : 'landscape';
const PIXABAY_KEY = process.env.PIXABAY_API_KEY;
const clips = [];
const seen = new Set();

async function searchPexels(q) {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&orientation=${orientation}&size=medium&per_page=6`,
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

for (const q of queries) {
  const found = [...(await searchPexels(q)), ...(PIXABAY_KEY ? await searchPixabay(q) : [])];
  for (const c of found) {
    if (seen.has(c.id) || clips.length >= MAX_CLIPS) continue;
    seen.add(c.id);
    clips.push(c);
  }
}
if (clips.length === 0) fail('No usable clips found for the given queries.');
process.stderr.write(`Using ${clips.length} unique clip(s) (${clips.filter((c) => c.source === 'Pixabay').length} from Pixabay)\n`);

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
  if (FAST) {
    // Crisp: straight cover-crop, rely on the footage's own motion (queries
    // demand people/action shots) — uniform drift on every shot reads sleepy.
    run('ffmpeg', ['-y', '-ss', String(start), '-i', downloaded.get(clip.id), '-t', segLen.toFixed(2),
      '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,format=yuv420p`,
      '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', seg]);
  } else {
    // Gentle Ken Burns drift for slow-cinema pieces.
    const W2 = Math.ceil((W * 1.12) / 2) * 2;
    const H2 = Math.ceil((H * 1.12) / 2) * 2;
    const drift = i % 2 === 0 ? `(in_w-out_w)*(t/${segLen})` : `(in_w-out_w)*(1-t/${segLen})`;
    run('ffmpeg', ['-y', '-ss', String(start), '-i', downloaded.get(clip.id), '-t', segLen.toFixed(2),
      '-vf', `scale=${W2}:${H2}:force_original_aspect_ratio=increase,crop=${W2}:${H2},fps=30,crop=${W}:${H}:x='${drift}':y='(in_h-out_h)/2',format=yuv420p`,
      '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', seg]);
  }
  segFiles.push(seg);
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
let cueStarts = []; // seconds, for cue-synced SFX
if (args.srt) {
  if (!existsSync(args.srt)) fail(`--srt file not found: ${args.srt}`);
  // Noto Sans CJK covers zh/yue/ja; falls back to default font if not installed.
  const cjk = existsSync('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');
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
  const voiced = args.music || sfxBed ? join(tmp, 'voiced.mp4') : outFile;
  run('ffmpeg', ['-y', '-i', silent, '-i', audioFile, '-vf', filters.join(','),
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', voiced]);
  if (args.music || sfxBed) {
    const ins = ['-i', voiced];
    const parts = [];
    let n = 1;
    const mix = ['[0:a]'];
    if (args.music) { ins.push('-stream_loop', '-1', '-i', args.music); parts.push(`[${n}:a]volume=0.13,afade=t=in:d=1[m]`); mix.push('[m]'); n++; }
    if (sfxBed) { ins.push('-i', sfxBed); parts.push(`[${n}:a]volume=0.5[s]`); mix.push('[s]'); n++; }
    run('ffmpeg', ['-y', ...ins, '-filter_complex',
      `${parts.join(';')};${mix.join('')}amix=inputs=${mix.length}:duration=first:dropout_transition=2:normalize=0[aout]`,
      '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
      '-movflags', '+faststart', outFile]);
  }
} else {
  // Subtitle-driven mode (owner directive 2026-07-10): no narration — the music
  // IS the audio, at full presence, looped/trimmed to the target duration; the
  // SFX pops sit lightly on top, synced to each cue's entry.
  const ins = ['-i', silent, '-stream_loop', '-1', '-i', args.music];
  let sfxChain = '';
  let aout = '[mus]';
  if (sfxBed) { ins.push('-i', sfxBed); sfxChain = `[2:a]volume=0.5[sfx];[mus][sfx]amix=inputs=2:duration=first:normalize=0[aout];`; aout = '[aout]'; }
  else { sfxChain = ''; aout = '[mus]'; }
  run('ffmpeg', ['-y', ...ins,
    '-filter_complex',
    `[0:v]${filters.join(',')}[vout];` +
    `[1:a]volume=0.85,afade=t=in:d=1,afade=t=out:st=${Math.max(0, audioDur - 1.6).toFixed(2)}:d=1.5${sfxBed ? '[mus]' : '[aout]'};` +
    sfxChain,
    '-map', '[vout]', '-map', aout, '-t', audioDur.toFixed(2),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', outFile]);
}

const credits = clips.map(({ query, sourceUrl, photographer, source }) => ({ query, sourceUrl, photographer, source }));
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
function assEsc(s) { return s.replace(/[{}]/g, '').replace(/\\/g, '⧵'); }
function highlightNums(s, base) {
  // Coral pop on numbers/quantities — the 小红书 "数字弹出条" feel. A unit only
  // joins the number when it is a standalone token (so "900 meters" colours "900",
  // not "900 m|eters").
  return assEsc(s).replace(
    /(\$?\d[\d,.]*(?:\s?(?:m|km|km²|%|°C|°|AD|BC|BCE|CE|am|pm|kg|min|hrs?|hours?|years?)(?![A-Za-z]))?)/gi,
    (mtch) => `{\\c${C_CORAL}}${mtch}{\\c${base}}`,
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
  const enFs = vertical ? (voiced ? 54 : 72) : (voiced ? 44 : 54);
  const zhFs = vertical ? (voiced ? 60 : 80) : (voiced ? 48 : 60);
  const marginV = vertical ? 130 : 54;
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
  const dialog = cues.map((c) => {
    const enBase = c.en.trimStart().startsWith('★') ? C_AMBER : C_WHITE;
    const en = `{\\c${enBase}}${highlightNums(c.en, enBase)}`;
    const zh = c.zh ? `\\N{\\fs${zhFs}\\c${C_GOLD}}${wrapZh(assEsc(c.zh), zhMax)}` : '';
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
