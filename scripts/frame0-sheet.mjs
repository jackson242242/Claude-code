#!/usr/bin/env node
/**
 * Frame-0 contact sheet: one labelled JPG of the frames at 0.0 s, 0.5 s, 1.0 s,
 * 50 % ("mid") and end-1 s of a rendered video, so the routine can LOOK at frame 0 before
 * upload (frame-0 guard: no aerial opening; frame 0 = forward first-person motion
 * or an eye-level ground shot — compare 0.0/0.5/1.0 to see whether it moves).
 * When frame 0 is black (slow-pace fade-in, e.g. longform) an extra "0.6 s after
 * fade" tile is added and a NOTE line is printed. A missing label font is warned
 * about on stderr (the sheet is then unlabelled).
 *
 * Usage: node scripts/frame0-sheet.mjs --video <mp4> --out <jpg> [--tile-width 360]
 * Needs only ffmpeg/ffprobe. Prints the sheet path and the sampled timestamps.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
}
if (!args.video || !args.out) fail('Usage: node scripts/frame0-sheet.mjs --video <mp4> --out <jpg> [--tile-width 360]');
if (!existsSync(args.video)) fail(`--video not found: ${args.video}`);

const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
  'stream=width,height:format=duration', '-of', 'json', args.video]));
const dur = Number(probe.format?.duration);
const vw = Number(probe.streams?.[0]?.width), vh = Number(probe.streams?.[0]?.height);
if (!dur || !vw || !vh) fail(`Could not read duration/size of ${args.video}`);
const last = Math.max(0, dur - 0.05); // never seek past the final frame
// Slow-pace renders (longform L) fade in from black over 0.5 s, so a black 0.0 s
// tile says nothing about the opening shot: add a 0.6 s "after fade" tile then.
const y0 = frameLuma(0);
const black0 = y0 != null && y0 < 20; // limited-range black is 16
const shots = [
  [0, '0.0 s'],
  ...(black0 ? [[0.6, '0.6 s after fade']] : []),
  [0.5, '0.5 s'],
  [1.0, '1.0 s'],
  [dur / 2, `mid ${(dur / 2).toFixed(1)} s`],
  [Math.max(0, dur - 1), `end-1 ${Math.max(0, dur - 1).toFixed(1)} s`],
].map(([t, label]) => [Math.min(t, last), label]).sort((a, b) => a[0] - b[0]);

const tileW = Math.round(Number(args['tile-width'] || (vh > vw ? 360 : 480)) / 2) * 2;
const fs = Math.max(14, Math.round(tileW / 14));
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
if (!existsSync(FONT)) {
  process.stderr.write(`WARN: ${FONT} not found — tiles are UNLABELLED; left to right: ${shots.map(([, l]) => l).join(' | ')}\n`);
}
const inputs = shots.flatMap(([t]) => ['-ss', t.toFixed(3), '-i', args.video]);
const tiles = shots.map(([, label], i) => {
  const text = label.replace(/[^\w .-]/g, ''); // labels are plain: no drawtext escapes needed
  const draw = existsSync(FONT)
    ? `,drawtext=fontfile=${FONT}:text='${text}':fontsize=${fs}:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=8:x=10:y=10`
    : '';
  // a thin dark border between tiles so frame edges stay visible
  return `[${i}:v]scale=${tileW}:-2,setsar=1${draw},pad=iw+8:ih+8:4:4:color=0x202020[t${i}]`;
});
mkdirSync(dirname(args.out) || '.', { recursive: true });
run('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex',
  `${tiles.join(';')};${shots.map((_, i) => `[t${i}]`).join('')}hstack=inputs=${shots.length}[s]`,
  '-map', '[s]', '-frames:v', '1', '-q:v', '3', args.out]);
console.log(`Wrote ${args.out} (${vw}x${vh}, ${dur.toFixed(2)} s; frames at ${shots.map(([t]) => t.toFixed(2)).join(', ')} s)`);
if (black0) console.log(`NOTE: frame 0 is black (luma ${y0.toFixed(0)}, fade-in) — judge the opening shot on the "0.6 s after fade" tile`);

// Mean luma (YAVG, 0-255) of the frame at time t, or null when it cannot be read.
function frameLuma(t) {
  try {
    const out = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(t), '-i', args.video, '-frames:v', '1',
      '-vf', 'signalstats,metadata=mode=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const m = /YAVG=([\d.]+)/.exec(out);
    return m ? Number(m[1]) : null;
  } catch { return null; }
}

function run(bin, a) {
  try {
    return execFileSync(bin, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }).trim();
  } catch (e) {
    fail(`${bin} failed:\n${e.stderr || e.message}`);
  }
}
function fail(msg) {
  console.error(msg);
  process.exit(1);
}
