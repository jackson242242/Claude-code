#!/usr/bin/env node
/**
 * render-mashup.mjs — turn Alex's EDL manifest into a real 9:16 short video.
 *
 * The 鬼灭 mashup factory's editing engine. Reads a JSON manifest (the machine-
 * readable form of Alex's 分镜表/EDL), trims + crops each source clip to vertical,
 * hard-cuts them together (deliberate handmade feel), burns in 图文 captions via
 * libass, and lays the commercial-safe song over the top. Output is a post-ready mp4.
 *
 * No system install and no credential needed: ffmpeg ships via the `ffmpeg-static`
 * npm package. Source clips + audio + (optionally) a CJK font are the owner's inputs
 * (see kimetsu/PLAYBOOK.md §2 for the copyright posture on footage/audio).
 *
 * Usage:
 *   node scripts/render-mashup.mjs --manifest kimetsu/briefs/manifest-2026-06-06.json \
 *     --out kimetsu/briefs/out/2026-06-06.mp4
 *
 * Manifest shape (see kimetsu/briefs/manifest.schema.md):
 *   {
 *     "output":  { "width": 1080, "height": 1920, "fps": 30 },
 *     "fontFile": "kimetsu/assets/fonts/handwritten.ttf",   // optional; CJK system font used if omitted
 *     "audio":   { "src": "kimetsu/assets/<date>/song.m4a", "fadeOut": 1.5, "gainDb": -2 },
 *     "clips":   [ { "src": "...mp4", "in": 2.0, "dur": 4.5 }, ... ],
 *     "texts":   [ { "content": "他从没赢过，但他没停过", "start": 1, "dur": 3,
 *                    "size": 64, "color": "white", "xPct": 0.5, "yPct": 0.72 }, ... ]
 *   }
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');

const args = parseArgs(process.argv.slice(2));
if (!args.manifest || !args.out) {
  fail('Usage: node scripts/render-mashup.mjs --manifest <file.json> --out <file.mp4>');
}
if (!existsSync(args.manifest)) fail(`Manifest not found: ${args.manifest}`);

const m = JSON.parse(readFileSync(args.manifest, 'utf8'));
const W = m.output?.width ?? 1080;
const H = m.output?.height ?? 1920;
const FPS = m.output?.fps ?? 30;
const clips = Array.isArray(m.clips) ? m.clips : [];
const texts = Array.isArray(m.texts) ? m.texts : [];

if (clips.length === 0) fail('Manifest has no clips. Add at least one { src, dur } to "clips".');
for (const c of clips) {
  if (!c.src) fail('Every clip needs a "src".');
  if (!existsSync(c.src)) fail(`Clip not found: ${c.src}\nDrop source footage into the assets folder first (PLAYBOOK §2).`);
  if (!(c.dur > 0)) fail(`Clip "${c.src}" needs a positive "dur" (seconds on screen).`);
}
if (m.fontFile && !existsSync(m.fontFile)) fail(`fontFile not found: ${m.fontFile}`);

const xfade = Number(m.transition?.duration) > 0 ? Number(m.transition.duration) : 0;
const xfadeType = m.transition?.type ?? 'fade';
// With crossfades, each transition overlaps two clips, so the timeline shrinks by (n-1)*xfade.
const rawTotal = clips.reduce((s, c) => s + Number(c.dur), 0);
const total = round3(xfade > 0 ? rawTotal - (clips.length - 1) * xfade : rawTotal);
if (total < 30 || total > 50) {
  console.warn(`⚠ Total video length ${total}s is outside the 35–45s sweet spot (PLAYBOOK §5). Adjust clip durations if unintended.`);
}

const work = mkdtempSync(join(tmpdir(), 'mashup-'));
const inputs = [];
const filters = [];
const isImage = (p) => /\.(png|jpe?g|webp|bmp)$/i.test(p);

// 1) Each clip → a normalized WxH segment. Video: scale-to-cover + crop. Image still:
//    Ken Burns (slow zoom/pan via zoompan) so a generated still becomes a living shot.
clips.forEach((c, i) => {
  if (isImage(c.src)) {
    inputs.push('-i', c.src); // single still; zoompan synthesizes the frames
    filters.push(`[${i}:v]${kenBurns(c, W, H, FPS)},setsar=1,format=yuv420p[v${i}]`);
  } else {
    inputs.push('-ss', String(c.in ?? 0), '-t', String(c.dur), '-i', c.src);
    filters.push(
      `[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},` +
        `fps=${FPS},setsar=1,format=yuv420p[v${i}]`,
    );
  }
});

// 2) Join clips — optional uniform crossfade, else hard cuts (the handmade default).
if (xfade > 0 && clips.length > 1) {
  let prev = '[v0]';
  let acc = Number(clips[0].dur); // running length of the composite so far
  for (let i = 1; i < clips.length; i += 1) {
    const off = round3(acc - xfade);
    const out = i === clips.length - 1 ? 'vcat' : `xf${i}`;
    filters.push(`${prev}[v${i}]xfade=transition=${xfadeType}:duration=${xfade}:offset=${off}[${out}]`);
    prev = `[${out}]`;
    acc = round3(acc + Number(clips[i].dur) - xfade);
  }
} else {
  const concatInputs = clips.map((_, i) => `[v${i}]`).join('');
  filters.push(`${concatInputs}concat=n=${clips.length}:v=1:a=0[vcat]`);
}

// 3) Burn in 图文 captions via libass (an ASS track styled for legible CJK + handmade outline).
let vlabel = 'vcat';
if (texts.length > 0) {
  const family = resolveFontFamily(m.fontFile, m.fontName);
  const assPath = join(work, 'subs.ass');
  writeFileSync(assPath, buildAss({ texts, W, H, family }), 'utf8');
  const fontsdir = m.fontFile ? `:fontsdir='${dirname(m.fontFile)}'` : '';
  filters.push(`[vcat]subtitles='${assPath}'${fontsdir}[vtext]`);
  vlabel = 'vtext';
}

// 4) Audio: the song, trimmed to video length with a gentle fade-out.
const audioSrc = m.audio?.src;
let mapAudio = null;
if (audioSrc) {
  if (!existsSync(audioSrc)) fail(`Audio not found: ${audioSrc}\nUse a commercial-safe / royalty-free track (PLAYBOOK §2).`);
  inputs.push('-i', audioSrc);
  const aIdx = clips.length; // audio input comes after all clip inputs
  const gain = m.audio?.gainDb ? `,volume=${m.audio.gainDb}dB` : '';
  const fade = m.audio?.fadeOut ?? 1.0;
  const fadeStart = round3(Math.max(0, total - fade));
  filters.push(
    `[${aIdx}:a]atrim=0:${total},asetpts=PTS-STARTPTS${gain},` +
      `afade=t=out:st=${fadeStart}:d=${fade}[aud]`,
  );
  mapAudio = '[aud]';
} else {
  console.warn('⚠ No audio in manifest — rendering silent. A song is the soul of the cut (PLAYBOOK §5).');
}

if (!existsSync(dirname(args.out))) mkdirSync(dirname(args.out), { recursive: true });

const ff = [
  '-y',
  ...inputs,
  '-filter_complex', filters.join(';'),
  '-map', `[${vlabel}]`,
  ...(mapAudio ? ['-map', mapAudio] : []),
  '-t', String(total),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
  ...(mapAudio ? ['-c:a', 'aac', '-b:a', '192k'] : []),
  '-movflags', '+faststart',
  args.out,
];

console.log(`▶ Rendering ${clips.length} clips → ${args.out} (${W}x${H}, ${total}s, ${FPS}fps)…`);
try {
  execFileSync(ffmpeg, ff, { stdio: ['ignore', 'inherit', 'inherit'] });
} catch (err) {
  fail(`ffmpeg failed: ${err.message}`);
}
console.log(`✓ Done: ${args.out} (${total}s, 9:16). Ready to deliver to Drive + post per Minji's schedule.`);

// 6) Optional cover/thumbnail: grab a frame for the SEO thumbnail (Canva can add the title).
if (m.cover) {
  const at = round3(m.cover.at ?? total * 0.15);
  const coverOut = args.out.replace(/\.[^./]+$/, '') + '.cover.jpg';
  try {
    execFileSync(ffmpeg, ['-y', '-ss', String(at), '-i', args.out, '-frames:v', '1', '-q:v', '3', coverOut], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    console.log(`✓ Cover: ${coverOut} (frame @ ${at}s)`);
  } catch {
    console.warn('⚠ Cover frame export failed (non-fatal).');
  }
}

// --- helpers ---------------------------------------------------------------

// Ken Burns on a still: prescale to a 2x canvas (kills zoompan jitter), then slow zoom/pan.
function kenBurns(c, W, H, FPS) {
  const frames = Math.max(1, Math.round(Number(c.dur) * FPS));
  const cw = W * 2;
  const ch = H * 2;
  const cover = `scale=${cw}:${ch}:force_original_aspect_ratio=increase,crop=${cw}:${ch}`;
  const cx = `iw/2-(iw/zoom/2)`;
  const cy = `ih/2-(ih/zoom/2)`;
  let z = `min(1.0+0.0012*on,1.18)`, x = cx, y = cy; // 'in' (slow push) is the default
  switch (c.motion) {
    case 'out': z = `if(eq(on,0),1.18,max(1.18-0.0012*on,1.0))`; break;
    case 'left': z = `1.12`; x = `(iw-iw/zoom)*(1-on/${frames})`; break;
    case 'right': z = `1.12`; x = `(iw-iw/zoom)*(on/${frames})`; break;
    case 'none': z = `1.0`; break;
    default: break; // 'in'
  }
  return `${cover},zoompan=z='${z}':x='${x}':y='${y}':d=${frames}:s=${W}x${H}:fps=${FPS}`;
}

function resolveFontFamily(fontFile, fontName) {
  if (fontName) return fontName;
  if (fontFile) {
    try {
      const fam = execFileSync('fc-query', ['--format=%{family[0]}', fontFile]).toString().trim();
      if (fam) return fam;
    } catch { /* fc-query absent — fall through to CJK default */ }
  }
  return 'WenQuanYi Zen Hei'; // CJK-capable system fallback
}

function buildAss({ texts, W, H, family }) {
  const colors = { white: '&H00FFFFFF', yellow: '&H0000FFFF', black: '&H00000000' };
  const head =
    `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\n` +
    `WrapStyle: 2\nScaledBorderAndShadow: yes\n\n` +
    `[V4+ Styles]\n` +
    `Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, ` +
    `Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, ` +
    `Alignment, MarginL, MarginR, MarginV, Encoding\n` +
    `Style: D,${family},56,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,3,0,5,40,40,40,1\n\n` +
    `[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const lines = texts.map((t) => {
    const start = Number(t.start ?? 0);
    const end = round3(start + Number(t.dur ?? 3));
    const x = Math.round(W * (t.xPct ?? 0.5));
    const y = Math.round(H * (t.yPct ?? 0.72));
    const size = t.size ?? 56;
    const colour = colors[t.color] ?? colors.white;
    const text = String(t.content ?? '').replace(/[{}]/g, '').replace(/\r?\n/g, '\\N');
    const ov = `{\\fs${size}\\1c${colour}\\an5\\pos(${x},${y})}${text}`;
    return `Dialogue: 0,${assTime(start)},${assTime(end)},D,,0,0,0,,${ov}`;
  });
  return head + lines.join('\n') + '\n';
}

function assTime(s) {
  const cs = Math.round(s * 100);
  const h = Math.floor(cs / 360000);
  const mm = Math.floor((cs % 360000) / 6000);
  const ss = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1]; i += 1; }
  }
  return out;
}
function round3(n) { return Math.round(n * 1000) / 1000; }
function fail(msg) { console.error(msg); process.exit(1); }
