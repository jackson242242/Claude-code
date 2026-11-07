#!/usr/bin/env node
/**
 * Normalize an owner-shot phone clip for editing: HDR→SDR tonemap when needed,
 * 1080p30 H.264, rotation baked in, audio preserved (owner ambient/voices are
 * content — never strip them).
 *
 * Usage: node scripts/prep-owner-clip.mjs --in IMG_1234.MOV --out clips/ep1-01.mp4 [--format 9x16|16x9|keep]
 */
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const args = {};
for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith('--')) args[process.argv[i].slice(2)] = process.argv[i + 1];
if (!args.in || !args.out) fail('Usage: node scripts/prep-owner-clip.mjs --in <clip> --out <mp4> [--format 9x16|16x9|keep]');

const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
  'stream=color_transfer,color_primaries,width,height', '-of', 'json', args.in]));
const s = probe.streams?.[0] || {};
const isHdr = ['smpte2084', 'arib-std-b67'].includes(s.color_transfer) || s.color_primaries === 'bt2020';

const vf = [];
if (isHdr) {
  // Tonemap HDR (HLG/PQ) to SDR bt709 — phones default to HDR; skipping this
  // yields washed-out gray footage after re-encode.
  vf.push('zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv');
}
if ((args.format || 'keep') === '9x16') vf.push('scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920');
else if (args.format === '16x9') vf.push('scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080');
vf.push('fps=30', 'format=yuv420p');

await mkdir(dirname(args.out), { recursive: true });
run('ffmpeg', ['-y', '-i', args.in, '-vf', vf.join(','),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
  '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', args.out]);
console.log(`${args.out} ready (${isHdr ? 'HDR→SDR tonemapped' : 'SDR passthrough'}, ${s.width}x${s.height} src)`);

function run(bin, a) {
  try { return execFileSync(bin, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { fail(`${bin} failed:\n${e.stderr || e.message}`); }
}
function fail(m) { console.error(m); process.exit(1); }
